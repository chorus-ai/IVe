/**
 * Adapter for Orthanc's REST API (the DICOM/PACS authority).
 *
 * Orthanc is infrastructure, not a feature, but dicom is its only consumer, so
 * the adapter lives here rather than in utils/; promote it if a second feature
 * needs it. It is the only module that knows Orthanc's URL, credentials and
 * response shapes.
 *
 * **Orthanc must never be reachable from the browser.** It exposes full PHI —
 * `/studies/{id}` returns `PatientMainDicomTags` with PatientName and PatientID
 * — and has no concept of our JWT sessions. Node is the gate; the allowlisting
 * that strips PHI lives in features/dicom/services/metadata.js, above this.
 *
 * There is deliberately no VITE_ equivalent: a `VITE_ORTHANC` var existed in
 * client/.env, unused, and was removed. Anything VITE_-prefixed is inlined into
 * the browser bundle, so a PACS origin there would bypass Node's auth entirely.
 */

const axios = require("axios");
const env = require("../../../config/env");

class OrthancError extends Error {
  constructor(status, detail) {
    super(detail);
    this.name = "OrthancError";
    this.status = status;
    this.problem = {
      type: status === 404 ? "not-found" : "orthanc-error",
      title: status === 404 ? "Not found in PACS" : "PACS request failed",
      detail,
      status,
    };
  }
}

const ensureConfigured = () => {
  if (!env.orthancUrl) {
    throw new OrthancError(503, "ORTHANC_URL is unset; see doc/dicom-backend-plan.md.");
  }
};

const authHeader = () => {
  if (!env.orthancUsername) return {};
  const raw = `${env.orthancUsername}:${env.orthancPassword || ""}`;
  return { Authorization: `Basic ${Buffer.from(raw).toString("base64")}` };
};

const wrap = (err, label) => {
  if (err instanceof OrthancError) return err;
  const status = err.response?.status;
  if (status === 404) return new OrthancError(404, `${label}: not found in PACS`);
  if (status) return new OrthancError(status, `${label}: Orthanc returned ${status}`);
  return new OrthancError(503, `${label}: ${err.code || err.message}`);
};

const request = async (path, { responseType = "json", label } = {}) => {
  ensureConfigured();
  try {
    const res = await axios.get(`${env.orthancUrl}${path}`, {
      headers: authHeader(),
      timeout: env.orthancTimeoutMs,
      responseType,
      // Instance files can be large; do not let axios truncate them.
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return res.data;
  } catch (err) {
    throw wrap(err, label || path);
  }
};

/** `GET /system` — also the reachability probe. */
exports.system = () => request("/system", { label: "system" });

/** Orthanc ids are its own hashes, not DICOM UIDs — never conflate the two. */
exports.listStudies = () => request("/studies", { label: "listStudies" });

// A DICOM UID is dotted decimal ("1.2.840.113970.3.57..."); an Orthanc id is
// five dash-separated hex groups. The two are never confusable, which is what
// makes accepting either safe.
const DICOM_UID = /^\d+(\.\d+)+$/;

exports.looksLikeDicomUid = (value) => DICOM_UID.test(String(value || ""));

/**
 * Accept either a StudyInstanceUID or an Orthanc study id.
 *
 * `cadaFile.path` stores **StudyInstanceUIDs** for DICOM events — that is the
 * standards-defined identifier and it survives a PACS rebuild or a move to a
 * different vendor, whereas an Orthanc id is internal to one instance. So the
 * UID is what belongs in our database and the translation happens here.
 */
exports.resolveStudyId = async (idOrUid) => {
  const value = String(idOrUid || "");
  if (!DICOM_UID.test(value)) return value; // already an Orthanc id

  ensureConfigured();
  let hits;
  try {
    const res = await axios.post(`${env.orthancUrl}/tools/lookup`, value, {
      headers: { ...authHeader(), "Content-Type": "text/plain" },
      timeout: env.orthancTimeoutMs,
    });
    hits = res.data;
  } catch (err) {
    throw wrap(err, "resolveStudyId");
  }

  const study = (hits || []).find((hit) => hit.Type === "Study");
  if (study) return study.ID;

  // Report what the UID actually identifies rather than a bare 404: passing a
  // series or instance UID where a study is expected is an easy mistake and
  // the message should say so.
  const other = (hits || [])[0];
  throw new OrthancError(
    404,
    other
      ? `UID resolves to a ${other.Type}, not a Study`
      : "UID not found in PACS"
  );
};
exports.getStudy = (id) => request(`/studies/${encodeURIComponent(id)}`, { label: "getStudy" });
exports.getSeries = (id) => request(`/series/${encodeURIComponent(id)}`, { label: "getSeries" });
exports.getInstance = (id) =>
  request(`/instances/${encodeURIComponent(id)}`, { label: "getInstance" });

/**
 * Expanded children. One request per level instead of one per child: a
 * 600-instance study would otherwise be 600 round trips.
 */
exports.getStudySeries = (id) =>
  request(`/studies/${encodeURIComponent(id)}/series`, { label: "getStudySeries" });
exports.getSeriesInstances = (id) =>
  request(`/series/${encodeURIComponent(id)}/instances`, { label: "getSeriesInstances" });

/** Flat `TagName: value` map. Raw and PHI-bearing — allowlist before returning. */
exports.getInstanceTags = (id) =>
  request(`/instances/${encodeURIComponent(id)}/simplified-tags`, { label: "getInstanceTags" });

/** Raw DICOM bytes, for cornerstone to render client-side. */
exports.getInstanceFile = (id) =>
  request(`/instances/${encodeURIComponent(id)}/file`, {
    responseType: "arraybuffer",
    label: "getInstanceFile",
  });

/** Server-rendered PNG, for thumbnails and list views. */
exports.getInstancePreview = (id) =>
  request(`/instances/${encodeURIComponent(id)}/preview`, {
    responseType: "arraybuffer",
    label: "getInstancePreview",
  });

/**
 * Server-rendered PNG with window/level applied.
 *
 * Orthanc does the windowing, which is what lets a viewer show a CT at the
 * right contrast without shipping 16-bit pixel data to the browser or pulling
 * in a WebGL renderer. Verified: different `window-center` values produce
 * genuinely different images, and `width` resizes.
 */
exports.getInstanceRendered = (id, { windowCenter, windowWidth, width } = {}) => {
  const params = new URLSearchParams();
  if (windowCenter !== undefined) params.set("window-center", String(windowCenter));
  if (windowWidth !== undefined) params.set("window-width", String(windowWidth));
  if (width !== undefined) params.set("width", String(width));
  const qs = params.toString();

  return request(
    `/instances/${encodeURIComponent(id)}/rendered${qs ? `?${qs}` : ""}`,
    { responseType: "arraybuffer", label: "getInstanceRendered" }
  );
};

/** `POST /tools/find` — the only non-GET call, used for study search. */
exports.find = async (query) => {
  ensureConfigured();
  try {
    const res = await axios.post(`${env.orthancUrl}/tools/find`, query, {
      headers: { ...authHeader(), "Content-Type": "application/json" },
      timeout: env.orthancTimeoutMs,
    });
    return res.data;
  } catch (err) {
    throw wrap(err, "find");
  }
};

exports.OrthancError = OrthancError;
