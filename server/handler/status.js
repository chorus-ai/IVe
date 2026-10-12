const { getCached, deleteCached } = require("../utils/cache");

// Generic status/result lookup for anything cached via utils/deferred-cache.js
// (currently: OMOP search/count queries that ran past their timeout). Flat,
// cross-cutting infra — not nested under any one feature's route namespace,
// since the underlying cache has no feature-specific knowledge either.
exports.getStatus = async (req, res) => {
  const { key } = req.params;

  const cached = await getCached(key);
  if (cached.hit) return res.status(200).json({ status: "completed", result: cached.value });

  const marker = await getCached(`${key}:processing`);
  if (marker.hit) return res.status(200).json({ status: "processing" });

  return res.status(404).json({ status: "unknown", message: "No result or in-progress work found for this key." });
};

// Explicit purge — the only way a cached slow-query result (written with no
// TTL) ever goes away. Clears both the result and any lingering marker.
exports.purge = async (req, res) => {
  const { key } = req.params;
  await Promise.all([deleteCached(key), deleteCached(`${key}:processing`)]);
  return res.status(204).send();
};
