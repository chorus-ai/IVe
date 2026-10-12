"use strict";

// Runs `fn` and caches its result under `key`, but never makes the caller
// wait more than `timeoutMs` for it.
//
//   - Finishes within the window  → cached with the normal TTL, returned
//     directly. This is the common case; nothing else in this module is
//     ever touched.
//   - Still running past the window → the SAME invocation (never re-run)
//     keeps going in the background; caller gets told to poll instead.
//     Once it resolves it's cached with SLOW_TTL_SECONDS — long, because
//     anything that took this long is worth keeping, but never infinite.
//
//     It used to be cached with no TTL at all. A `count()` against a
//     misconfigured database returns 0 rather than throwing, so it never hits
//     the .catch below; on a big table that 0 is also slow, which earned it
//     the permanent slot. The result was OMOP counts stuck at zero with
//     nothing in the system able to recompute them — the cache is read before
//     `fn` runs, so the query was never issued again. An expiry means the
//     same failure heals itself instead of needing a redis-cli del.
//
// Two dedup layers, for two different scopes:
//   - `inFlight` (this process's memory): dedupes concurrent requests for
//     the same key within this one process, from the moment `fn` starts —
//     covers "100 people request the same slow thing at once."
//   - the `<key>:processing` Redis marker (only ever written once a key has
//     proven itself slow): lets OTHER processes, if this ever runs as more
//     than one instance, see that a key is already being worked on past the
//     timeout and not independently start their own copy. It does not
//     protect the first `timeoutMs` window across processes — only inFlight
//     does that, and only within one process — see the discussion in
//     doc/ive/omop_cache_plan.md if this ever needs to scale beyond one VM.

const { getCached, setCached, deleteCached } = require("./cache");

const inFlight = new Map(); // key -> Promise<result>
const MARKER_TTL_SECONDS = 30; // self-expiring safety net if a background run never reports back
const SLOW_TTL_SECONDS = 86400; // 24h — slow results are worth keeping, but not forever

const TIMED_OUT = Symbol("timed-out");

function delay(ms) {
  return new Promise((resolve) => setTimeout(() => resolve(TIMED_OUT), ms));
}

async function runDeferred(key, fn, { timeoutMs, ttlSeconds }) {
  const cached = await getCached(key);
  if (cached.hit) return { status: "completed", result: cached.value, fromCache: true };

  if (!inFlight.has(key)) {
    const marker = await getCached(`${key}:processing`);
    if (marker.hit) return { status: "processing" };

    const startedAt = Date.now();
    const promise = fn()
      .then((result) => {
        const wasSlow = Date.now() - startedAt > timeoutMs;
        setCached(key, result, wasSlow ? SLOW_TTL_SECONDS : ttlSeconds);
        if (wasSlow) deleteCached(`${key}:processing`);
        return result;
      })
      .catch((err) => {
        deleteCached(`${key}:processing`); // don't leave a stale marker behind on failure
        console.error(`[deferred] query failed for ${key}`, err.message);
        throw err;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
  }

  const tracked = inFlight.get(key);
  const raced = await Promise.race([tracked, delay(timeoutMs)]);

  if (raced === TIMED_OUT) {
    setCached(`${key}:processing`, true, MARKER_TTL_SECONDS);
    tracked.catch(() => {}); // already logged above; just prevent an unhandled rejection here
    return { status: "processing" };
  }
  return { status: "completed", result: raced, fromCache: false };
}

module.exports = { runDeferred };
