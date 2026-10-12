"use strict";

const { createClient } = require("redis");
const { connection } = require("./queue"); // reuse the same REDIS_HOST/REDIS_PORT resolution as BullMQ

let client;

function getRedisClient() {
  if (!client) {
    client = createClient({
      socket: {
        host: connection.host,
        port: connection.port,
        connectTimeout: 2000,
        // Probe once. If Redis isn't reachable, give up for good instead of
        // retrying forever — REDIS_HOST/REDIS_PORT need no explicit "on" switch:
        // if something's listening at the default, it's auto-detected; if not,
        // this fails fast a single time and stays quietly disabled.
        reconnectStrategy: () => false,
      },
      // Commands issued while disconnected must reject immediately, not queue —
      // otherwise a down Redis hangs the request instead of falling back to the DB.
      disableOfflineQueue: true,
    });
    client.on("error", (err) => console.error("[redis] client error", err.message));
    client.connect().catch((err) => console.error("[redis] connect failed — caching disabled for this run:", err.message));
  }
  return client;
}

module.exports = { getRedisClient };
