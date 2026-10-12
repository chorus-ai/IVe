/**
 * WFDB records from the bucket, decoded by python-scripts/wfdb-handler.py.
 * A capability, like features/dicom, not owned by one app: IVe's waveform
 * widget uses it, and CADA's viewer can. Contract: ../swagger.json.
 *
 * Records are addressed by their bucket-relative path without extension
 * (`waveforms/mimic_iv/p100/.../85594648_0001`); wfdb reads the .hea header
 * and its .dat files from there. There are no waveform tables — the bucket is
 * the index, as Orthanc is for features/dicom.
 *
 * Every path is confined to BUCKET_PATH, symlinks included. The client
 * supplies it, so without that check `../../proc/self/environ` would be a
 * valid "record".
 */

const fs = require("fs/promises");
const path = require("path");
const env = require("../../../config/env");
const { runJson } = require("../../../utils/python");

// The widget fetches 30 s chunks; the cap bounds one decode's memory and
// response size whatever a caller asks for.
const DEFAULT_RANGE_SEC = 30;
const MAX_RANGE_SEC = 600;
const DECODE_TIMEOUT_MS = 60000;

class WaveformError extends Error {
  constructor(status, title, detail) {
    super(detail);
    this.status = status;
    this.problem = { type: "waveform-error", title, detail, status };
  }
}

const badRequest = (detail) => new WaveformError(400, "Invalid waveform request", detail);

const isInside = (root, p) => p === root || p.startsWith(root + path.sep);

/** Bucket-relative record path → absolute record path (no extension). */
const resolveRecord = async (filename) => {
  if (!env.bucketPath) {
    throw new WaveformError(503, "Waveforms unavailable", "BUCKET_PATH is unset.");
  }
  if (typeof filename !== "string" || !filename.trim()) throw badRequest("`filename` is required.");
  if (path.isAbsolute(filename)) throw badRequest("`filename` must be relative to the bucket.");

  const rel = filename.trim().replace(/\.(hea|dat)$/i, "");
  const root = await fs.realpath(env.bucketPath);
  const full = path.resolve(root, rel);
  if (!isInside(root, full)) throw badRequest("`filename` is outside the bucket.");

  // realpath resolves symlinks, so a link inside the bucket pointing out of it
  // is caught here rather than handed to wfdb.
  let header;
  try {
    header = await fs.realpath(`${full}.hea`);
  } catch {
    throw new WaveformError(404, "Record not found", `No WFDB header for ${rel}.`);
  }
  if (!isInside(root, header)) throw badRequest("`filename` is outside the bucket.");

  return full;
};

const toSeconds = (value, fallback, name) => {
  if (value === undefined || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw badRequest(`\`${name}\` must be a non-negative number.`);
  return n;
};

/**
 * Decode [offset, offset + range) seconds of a record.
 *
 * Resolves to wfdb-handler.py's JSON: StartTime, OffsetInSec, TicksPerSec,
 * SamplesPerChannel, TotalSamples, DurationSec, WaveformData[].
 */
exports.read = async ({ filename, offset, range }) => {
  const recordPath = await resolveRecord(filename);
  const offsetSec = toSeconds(offset, 0, "offset");
  const rangeSec = Math.min(toSeconds(range, DEFAULT_RANGE_SEC, "range"), MAX_RANGE_SEC);
  if (rangeSec === 0) throw badRequest("`range` must be greater than 0.");

  return runJson("wfdb-handler.py", [recordPath, offsetSec, rangeSec], {
    timeoutMs: DECODE_TIMEOUT_MS,
  });
};
