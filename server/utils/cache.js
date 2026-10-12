"use strict";

// Generic Redis-backed JSON cache: normalize a value for stable key hashing,
// get/set by key with a TTL. No knowledge of any specific feature — callers
// own their own key scheme (see e.g. features/omop/services/omop-search-key.js).

const { getRedisClient } = require("./redis");

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sortKeysDeep(value[k]);
        return acc;
      }, {});
  }
  return value;
}

function normalize(value) {
  // does not mutate `value` — sortKeysDeep builds new objects/arrays throughout
  return sortKeysDeep(value);
}

async function getCached(key) {
  const client = getRedisClient();
  try {
    const raw = await client.get(key);
    if (!raw) return { hit: false };
    try {
      return { hit: true, value: JSON.parse(raw) };
    } catch (_parseErr) {
      await client.del(key); // corrupt cache entry — evict and treat as miss
      return { hit: false };
    }
  } catch (err) {
    console.error(`[cache] read failed for ${key}, falling back`, err.message);
    return { hit: false };
  }
}

// ttlSeconds is optional — a falsy value (undefined/null/0) writes with no
// expiry at all, for results worth keeping indefinitely (see utils/deferred-cache.js).
async function setCached(key, value, ttlSeconds) {
  const client = getRedisClient();
  try {
    await client.set(key, JSON.stringify(value), ttlSeconds ? { EX: ttlSeconds } : undefined);
  } catch (err) {
    console.error(`[cache] write failed for ${key}`, err.message);
  }
}

async function deleteCached(key) {
  const client = getRedisClient();
  try {
    await client.del(key);
  } catch (err) {
    console.error(`[cache] delete failed for ${key}`, err.message);
  }
}

module.exports = { normalize, getCached, setCached, deleteCached };
