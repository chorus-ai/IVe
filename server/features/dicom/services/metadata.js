/**
 * PHI allowlisting for DICOM tags.
 *
 * **Allowlist, never denylist.** Vendors put arbitrary content in private tags
 * and new ones ship with new scanner software, so a denylist misses PHI by
 * construction. Anything not named here does not leave the server.
 *
 * Orthanc hands back full headers — `/studies/{id}` even has a dedicated
 * `PatientMainDicomTags` block with PatientName and PatientID — so this module
 * is the boundary that makes the PACS safe to expose.
 */

/** Tags a viewer needs to render and window an image. No identifiers. */
const INSTANCE_TAGS = [
  "Rows",
  "Columns",
  "BitsAllocated",
  "BitsStored",
  "HighBit",
  "PixelRepresentation",
  "SamplesPerPixel",
  "PhotometricInterpretation",
  "PixelSpacing",
  "SliceThickness",
  "SpacingBetweenSlices",
  "WindowCenter",
  "WindowWidth",
  "RescaleSlope",
  "RescaleIntercept",
  "Modality",
  "InstanceNumber",
  "SeriesNumber",
  "ImageOrientationPatient",
  "ImagePositionPatient",
  "SliceLocation",
  "TransferSyntaxUID",
  "NumberOfFrames",
  // Kept deliberately: the client flags studies whose pixels may carry burned-in
  // PHI, which no header can hide. See doc/dicom-service-plan.md §5.
  "BurnedInAnnotation",
];

/** Study/series descriptors. Excludes StudyDate — a date is an identifier. */
const STUDY_TAGS = ["StudyDescription", "StudyInstanceUID"];
const SERIES_TAGS = [
  "SeriesDescription",
  "SeriesInstanceUID",
  "SeriesNumber",
  "Modality",
  "BodyPartExamined",
];

const pick = (source, allowed) => {
  const out = {};
  if (!source) return out;
  for (const tag of allowed) {
    if (source[tag] !== undefined && source[tag] !== "") out[tag] = source[tag];
  }
  return out;
};

exports.INSTANCE_TAGS = INSTANCE_TAGS;
exports.STUDY_TAGS = STUDY_TAGS;
exports.SERIES_TAGS = SERIES_TAGS;

exports.instanceTags = (tags) => pick(tags, INSTANCE_TAGS);
exports.studyTags = (tags) => pick(tags, STUDY_TAGS);
exports.seriesTags = (tags) => pick(tags, SERIES_TAGS);

/**
 * Numbers arrive from Orthanc as strings, and multi-valued tags as
 * backslash-delimited strings ("0.7\\0.7"). Normalise so the client does not
 * have to guess which.
 */
const NUMERIC = new Set([
  "Rows", "Columns", "BitsAllocated", "BitsStored", "HighBit",
  "PixelRepresentation", "SamplesPerPixel", "InstanceNumber", "SeriesNumber",
  "NumberOfFrames", "SliceThickness", "SpacingBetweenSlices", "SliceLocation",
  "RescaleSlope", "RescaleIntercept", "WindowCenter", "WindowWidth",
]);
const MULTI = new Set([
  "PixelSpacing", "ImageOrientationPatient", "ImagePositionPatient",
  "WindowCenter", "WindowWidth",
]);

exports.coerce = (tags) => {
  const out = {};
  for (const [key, raw] of Object.entries(tags)) {
    const value = String(raw);
    if (MULTI.has(key) && value.includes("\\")) {
      const parts = value.split("\\").map(Number);
      out[key] = parts.every((n) => Number.isFinite(n)) ? parts : value;
    } else if (NUMERIC.has(key)) {
      const n = Number(value);
      out[key] = Number.isFinite(n) ? n : value;
    } else {
      out[key] = raw;
    }
  }
  return out;
};
