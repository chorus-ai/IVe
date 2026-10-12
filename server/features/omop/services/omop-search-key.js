"use strict";

// Cache-key scheme for OMOP entity list/search — the one OMOP-specific piece
// of the cache pipeline. Generic get/set/normalize live in utils/cache.js.
//
// A cached response depends on the filter body AND every query param that
// changes what's returned (page, pageSize, sortOrder, attrs, count, countOnly)
// — all of it goes into the key.

const { createHash } = require("crypto");

function buildCacheKey(entity, normalized) {
  const { query = {}, body = {} } = normalized;
  const bodyKeys = Object.keys(body);

  // Readable key only for the simplest, best-known shape: no query params
  // beyond page/pageSize, single-field single-value (or unfiltered) body.
  const extraQueryKeys = Object.keys(query).filter((k) => k !== "page" && k !== "pageSize");
  const isSimple =
    extraQueryKeys.length === 0 &&
    (bodyKeys.length === 0 || (bodyKeys.length === 1 && Array.isArray(body[bodyKeys[0]]) && body[bodyKeys[0]].length === 1));

  if (isSimple) {
    const filterPart = bodyKeys.length === 0 ? "all" : `${bodyKeys[0]}=${body[bodyKeys[0]][0]}`;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    return `omop:${entity}:${filterPart}:page=${page}:size=${pageSize}`;
  }

  const json = JSON.stringify(normalized);
  const hash = createHash("sha256").update(json).digest("hex");
  return `omop:${entity}:sha256:${hash}`;
}

module.exports = { buildCacheKey };
