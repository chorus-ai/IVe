"use strict";

const { validateFilterBody, validateQuery, ValidationError, CACHE_TTL_SECONDS } = require("./omop-search-validator");
const { buildCacheKey } = require("./omop-search-key");
const { normalize } = require("../../../utils/cache");
const { runDeferred } = require("../../../utils/deferred-cache");
const { toTabular, getAttributes } = require("./_helper");

// Anything that doesn't resolve within this window gets deferred — the
// request gets a 202 instead of hanging, and the caller can poll
// GET /api/status/:key for the result once it lands.
const SLOW_QUERY_TIMEOUT_MS = 2500;

// Wraps the existing findAll/advancedSearch + countAll/countBySearch chain
// with validation + caching, while preserving the tabular response shape
// ({ header, rows } / { header, rows, count } / { count }) the frontend
// (client/src/apps/ive/api/omop.ts) already expects. Used for BOTH
// GET /<entity> (no filter body) and POST /<entity>/search (filter body) —
// "just browsing the table" and "searching it" are the same cached path.
function createCachedListHandler(entity, service) {
  return async (req, res) => {
    let filter, page, pageSize, sortOrder;
    try {
      filter = validateFilterBody(entity, req.body);
      ({ page, pageSize, sortOrder } = validateQuery(entity, req.query, filter));
    } catch (err) {
      const statusCode = err instanceof ValidationError ? err.statusCode : 500;
      return res.status(statusCode).json({ message: err.message });
    }

    const { attrs, count, countOnly } = req.query;
    const normalized = normalize({ query: { page, pageSize, sortOrder, attrs, count, countOnly }, body: filter });
    const key = buildCacheKey(entity, normalized);

    const isCountOnly = countOnly === "true";
    const includeCount = count === "true";
    const hasFilter = Object.keys(filter).length > 0;

    const runQuery = async () => {
      if (isCountOnly) {
        const total = hasFilter ? await service.countBySearch(filter) : await service.countAll();
        return { count: total };
      }
      const rows = hasFilter
        ? await service.advancedSearch(filter, attrs, page, pageSize, sortOrder)
        : await service.findAll(attrs, page, pageSize, sortOrder);
      const tabular = toTabular(rows, entity, getAttributes(attrs, entity));
      return includeCount
        ? { ...tabular, count: hasFilter ? await service.countBySearch(filter) : await service.countAll() }
        : tabular;
    };

    let outcome;
    try {
      outcome = await runDeferred(key, runQuery, { timeoutMs: SLOW_QUERY_TIMEOUT_MS, ttlSeconds: CACHE_TTL_SECONDS });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }

    if (outcome.status === "processing") {
      res.set("X-Cache", "MISS");
      return res.status(202).json({ status: "processing", key, statusUrl: `/api/status/${encodeURIComponent(key)}` });
    }

    res.set("X-Cache", outcome.fromCache ? "HIT" : "MISS");
    return res.json(outcome.result);
  };
}

module.exports = { createCachedListHandler };
