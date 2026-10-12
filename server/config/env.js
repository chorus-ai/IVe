"use strict";

// Single environment resolver. Reads process.env ONCE and exposes a typed
// config object.

require("dotenv").config();

const nodeEnv = process.env.NODE_ENV || "development";

// FEATURES toggle: comma-separated allowlist of features to mount at boot.
// Unset/empty => null => ALL features load (preserves pre-toggle behaviour).
const features = process.env.FEATURES
  ? process.env.FEATURES.split(",").map((s) => s.trim()).filter(Boolean)
  : null;
const isFeatureEnabled = (name) => features === null || features.includes(name);

// ---- DB connection builders (fully env-driven) ----
const buildDb = (prefix) => {
  const dialect = (process.env[`${prefix}_DB_DIALECT`] || "sqlite").toLowerCase();

  if (dialect === "sqlite") {
    const storage = process.env[`${prefix}_DB_STORAGE`];
    if (!storage) {
      throw new Error(
        `${prefix}_DB_STORAGE is required when ${prefix}_DB_DIALECT=sqlite`
      );
    }
    return { dialect: "sqlite", storage };
  }

  if (dialect === "postgres") {
    const schema = process.env[`${prefix}_DB_SCHEMA`];
    if (!schema) {
      throw new Error(
        `${prefix}_DB_SCHEMA is required when ${prefix}_DB_DIALECT=postgres`
      );
    }
    return {
      dialect: "postgres",
      host:     process.env[`${prefix}_DB_HOSTNAME`],
      port:     process.env[`${prefix}_DB_PORT`] || 5432,
      username: process.env[`${prefix}_DB_USERNAME`],
      password: process.env[`${prefix}_DB_PASSWORD`],
      database: process.env[`${prefix}_DB_NAME`],
      ssl: true,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      define: { schema },
    };
  }

  throw new Error(
    `Unknown ${prefix}_DB_DIALECT: "${dialect}" (expected sqlite|postgres)`
  );
};

// FEATURE_HAS_DEDICATED_DB toggle: comma-separated list of features that bind to
// their own Sequelize instance (via <FEATURE>_DB_* env vars, prefix = the
// uppercased feature name) instead of the shared app DB.
const dedicatedDbs = process.env.FEATURE_HAS_DEDICATED_DB
  ? process.env.FEATURE_HAS_DEDICATED_DB.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

const selectDb = () => {
  const cfg = { app: buildDb("APP") };
  for (const feature of dedicatedDbs) {
    if (isFeatureEnabled(feature)) cfg[feature] = buildDb(feature.toUpperCase());
  }
  return cfg;
};

module.exports = {
  nodeEnv,
  features,
  isFeatureEnabled,
  featureDbNames: dedicatedDbs,
  port: process.env.PORT || 8080,
  host: process.env.APP_HOST,
  appName: process.env.APP_NAME,
  appVersion: process.env.APP_VERSION,
  bucketPath: process.env.BUCKET_PATH,
  // Interpreter for python-scripts/ (utils/python.js).
  pythonPath: process.env.PYTHON_PATH,
  // Internal AI service (ai-service/). Bound to 127.0.0.1 and never proxied by
  // nginx — Node is the only public-facing backend.
  aiServiceUrl: process.env.AI_SERVICE_URL,
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
  aiServiceTimeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS || 60000),
  // Orthanc (DICOM/PACS authority). Server-side only — never exposed to the
  // browser, which is why there is no VITE_ equivalent that should be used.
  orthancUrl: process.env.ORTHANC_URL,
  orthancUsername: process.env.ORTHANC_USERNAME,
  orthancPassword: process.env.ORTHANC_PASSWORD,
  orthancTimeoutMs: Number(process.env.ORTHANC_TIMEOUT_MS || 30000),
  selectDb,
};
