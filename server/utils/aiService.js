/**
 * Adapter for the internal AI service (ai-service/, see doc/ai-service-plan-v2.md).
 *
 * ai-service is bound to 127.0.0.1 and is never proxied by nginx: Node is the
 * only public-facing backend. This module is the single place that knows the
 * service exists, holds the shared token, and translates its problem-detail
 * errors into something handlers can re-raise.
 *
 * Lives in utils/ alongside queue.js / redis.js / cache.js, which is where this
 * repo already keeps infrastructure adapters. (The v1 plan proposed
 * server/clients/ai_service_client.js; a new top-level folder for one adapter
 * is not worth the extra concept.)
 */

const axios = require("axios");
const FormData = require("form-data");
const env = require("../config/env");

class AiServiceError extends Error {
  constructor(status, problem) {
    super(problem?.detail || problem?.title || `ai-service returned ${status}`);
    this.name = "AiServiceError";
    this.status = status;
    this.problem = problem;
  }
}

const ensureConfigured = () => {
  if (!env.aiServiceUrl) {
    throw new AiServiceError(503, {
      type: "not-configured",
      title: "AI service not configured",
      detail: "AI_SERVICE_URL is unset; see doc/ai-service-plan-v2.md §3.",
      status: 503,
    });
  }
};

const headers = (extra = {}) => ({
  "X-Internal-Token": env.internalServiceToken || "",
  ...extra,
});

/** Normalise an axios failure into an AiServiceError carrying the problem detail. */
const wrap = (err, label) => {
  if (err instanceof AiServiceError) return err;

  const status = err.response?.status;
  if (status) return new AiServiceError(status, err.response.data);

  // Connection refused / timeout: the service is not running.
  return new AiServiceError(503, {
    type: "ai-service-unreachable",
    title: "AI service unreachable",
    detail: `${label}: ${err.code || err.message}`,
    status: 503,
  });
};

const post = async (path, body, label) => {
  ensureConfigured();
  try {
    const res = await axios.post(`${env.aiServiceUrl}${path}`, body, {
      headers: headers({ "Content-Type": "application/json" }),
      timeout: env.aiServiceTimeoutMs,
    });
    return res.data;
  } catch (err) {
    throw wrap(err, label);
  }
};

/**
 * OCR: image buffer -> text with word-level boxes in natural image pixels.
 * The multipart body is rebuilt here rather than streaming the original
 * request through, so the handler stays a plain Express handler.
 */
exports.extractImageText = async (buffer, filename, mimetype) => {
  ensureConfigured();

  const form = new FormData();
  form.append("image", buffer, {
    filename: filename || "upload.png",
    contentType: mimetype || "application/octet-stream",
  });

  try {
    const res = await axios.post(`${env.aiServiceUrl}/extract-image-text`, form, {
      headers: headers(form.getHeaders()),
      timeout: env.aiServiceTimeoutMs,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    return res.data;
  } catch (err) {
    throw wrap(err, "extract-image-text");
  }
};

exports.detectPhi = (text, confidenceFloor) =>
  post("/detect-phi", { text, confidence_floor: confidenceFloor }, "detect-phi");

exports.extractConcepts = (text, documentId) =>
  post("/extract-concepts", { text, document_id: documentId }, "extract-concepts");

exports.health = async () => {
  ensureConfigured();
  try {
    const res = await axios.get(`${env.aiServiceUrl}/health`, {
      timeout: 5000,
    });
    return res.data;
  } catch (err) {
    throw wrap(err, "health");
  }
};

exports.AiServiceError = AiServiceError;
