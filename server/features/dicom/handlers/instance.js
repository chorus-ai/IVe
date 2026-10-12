/**
 * HTTP surface for a single instance: allowlisted header, raw bytes, preview.
 *
 * The raw-bytes route exists because the pixels live in Orthanc, not under
 * BUCKET_PATH — so unlike every other viewer here, the client cannot use
 * /api/cada/file/raw. Node proxies instead of exposing Orthanc, because
 * Orthanc has no notion of our sessions and serves full PHI to anyone who
 * reaches it.
 */

const orthanc = require("../../../utils/orthanc");
const studyService = require("../services/study");
const phiScanService = require("../services/phiScan");

const fail = (res, err) => {
  const status = err.status || 500;
  res.status(status).send(
    err.problem || {
      type: "internal-error",
      title: "DICOM request failed",
      detail: err.message,
      status,
    }
  );
};

/** GET /api/dicom/instances/:id/metadata */
exports.metadata = async (req, res) => {
  try {
    res.send(await studyService.getInstanceMetadata(req.params.id));
  } catch (err) {
    fail(res, err);
  }
};

/** GET /api/dicom/instances/:id/file — raw DICOM for cornerstone. */
exports.file = async (req, res) => {
  try {
    const buffer = await orthanc.getInstanceFile(req.params.id);
    res.set("Content-Type", "application/dicom");
    // Immutable by SOP instance; let the browser keep it.
    res.set("Cache-Control", "private, max-age=86400");
    res.send(Buffer.from(buffer));
  } catch (err) {
    fail(res, err);
  }
};

const numeric = (value) => {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * GET /api/dicom/instances/:id/preview
 *   ?wc=<center>&ww=<width>&w=<pixels>
 *
 * Windowing happens in Orthanc, so changing the window is a new URL the
 * browser can cache rather than a client-side re-render. Unparseable values
 * are dropped rather than passed through, so a bad query degrades to the
 * instance's own defaults instead of erroring.
 */
exports.preview = async (req, res) => {
  try {
    const wc = numeric(req.query.wc);
    const ww = numeric(req.query.ww);
    const w = numeric(req.query.w);

    const buffer =
      wc !== undefined || ww !== undefined || w !== undefined
        ? await orthanc.getInstanceRendered(req.params.id, {
            windowCenter: wc,
            windowWidth: ww,
            width: w,
          })
        : await orthanc.getInstancePreview(req.params.id);
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "private, max-age=86400");
    res.send(Buffer.from(buffer));
  } catch (err) {
    fail(res, err);
  }
};

/**
 * GET /api/dicom/instances/:id/phi-scan
 *
 * Detects identifiers burned into the pixels — the PHI header scrubbing
 * cannot reach. Slow (render + OCR + classification), so it is a deliberate
 * per-instance call, not part of the study index.
 */
exports.phiScan = async (req, res) => {
  try {
    res.send(await phiScanService.scanInstance(req.params.id));
  } catch (err) {
    fail(res, err);
  }
};
