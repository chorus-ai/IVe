/**
 * Burned-in PHI detection for a DICOM frame.
 *
 * Header de-identification cannot touch pixels, so a study whose PatientName
 * has been scrubbed can still display it across the image. DICOM's
 * `BurnedInAnnotation` tag is supposed to declare this, but it is Type 1C and
 * most equipment omits it — in the local test set 76 of 151 series say
 * nothing at all. Trusting silence as "NO" is exactly the assumption that
 * leaks, so this detects it from the pixels instead.
 *
 * A workflow, not a service: it coordinates Orthanc (render) and ai-service
 * (OCR, then PHI classification), which is more than any one of them owns.
 *
 *   Orthanc /rendered ──▶ ai-service /extract-image-text ──▶ /detect-phi
 *                              (words + pixel boxes)    (which words are PHI)
 *                                        └────── mapped back ──────┘
 *
 * Both AI steps run locally on the host — an image of a clinical document is
 * PHI, and sending it out to find the PHI in it defeats the purpose.
 */

const orthanc = require("../../../utils/orthanc");
const ai = require("../../../utils/aiService");
const { getCached, setCached } = require("../../../utils/cache");

const CACHE_TTL_SECONDS = 86400; // pixels are immutable per SOP instance

/**
 * Resolve a phrase + 1-based occurrence to a character range in `text`.
 * Mirrors the scan ai-service uses, so occurrence counting agrees.
 */
const rangeOf = (text, phrase, occurrence = 1) => {
  let idx = -1;
  for (let i = 0; i < occurrence; i += 1) {
    idx = text.indexOf(phrase, idx + 1);
    if (idx === -1) return null;
  }
  return [idx, idx + phrase.length];
};

/**
 * Scan one instance's rendered pixels for burned-in identifiers.
 *
 * Returns the OCR boxes that overlap a PHI span, in **natural image pixels** —
 * the frame ImgViewer draws in, so a caller can outline them directly.
 */
exports.scanInstance = async (instanceId, { windowCenter, windowWidth } = {}) => {
  const cacheKey = `dicom:phiscan:${instanceId}`;
  const cached = await getCached(cacheKey);
  if (cached.hit) return cached.value;

  // 1. Render the frame Orthanc would show a reader.
  const png = Buffer.from(
    await orthanc.getInstanceRendered(instanceId, { windowCenter, windowWidth })
  );

  // 2. OCR it — words with pixel boxes.
  const ocr = await ai.extractImageText(png, `${instanceId}.png`, "image/png");
  const boxes = ocr.boxes || [];

  if (!boxes.length) {
    const empty = {
      instanceId,
      imageWidth: ocr.image_width,
      imageHeight: ocr.image_height,
      textFound: false,
      phiFound: false,
      regions: [],
      ocrEngine: ocr.engine,
    };
    await setCached(cacheKey, empty, CACHE_TTL_SECONDS);
    return empty;
  }

  // Join in reading order, tracking each box's span so PHI spans can be
  // mapped back to the pixels they came from.
  let text = "";
  const spans = boxes.map((box) => {
    const start = text.length;
    text += (start ? " " : "") + box.text;
    return { box, start: start ? start + 1 : 0, end: text.length };
  });

  // 3. Classify the text.
  const phi = await ai.detectPhi(text);
  const suggestions = phi.suggestions || [];

  // 4. Map each PHI phrase back to the boxes it covers.
  const flagged = new Map();
  for (const s of suggestions) {
    const range = rangeOf(text, s.phrase, s.occurrence);
    if (!range) continue;
    const [from, to] = range;

    for (const span of spans) {
      if (span.start >= to || span.end <= from) continue; // no overlap
      const prev = flagged.get(span.box);
      // A word can sit under two suggestions; keep the more confident label.
      if (!prev || s.confidence > prev.confidence) {
        flagged.set(span.box, { label: s.label, confidence: s.confidence, phrase: s.phrase });
      }
    }
  }

  const regions = [...flagged.entries()].map(([box, hit]) => ({
    text: box.text,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    label: hit.label,
    confidence: hit.confidence,
    phrase: hit.phrase,
  }));

  const result = {
    instanceId,
    imageWidth: ocr.image_width,
    imageHeight: ocr.image_height,
    textFound: true,
    phiFound: regions.length > 0,
    wordsRead: boxes.length,
    regions,
    ocrEngine: ocr.engine,
    phiProvider: phi.provider,
  };

  await setCached(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
};
