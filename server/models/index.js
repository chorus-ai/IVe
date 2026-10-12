"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = require("../config/env");
const { loadRelations } = require("../utils/relations");
const { loadSequelizeModels } = require("../utils/models");
const { loadFeatureModels, loadFeatureRelations } = require("../utils/feature");
const db = {};

// ---------- Boot banner + FEATURES validation ----------
const _featuresDir = path.join(__dirname, "..", "features");
const _all = fs.existsSync(_featuresDir)
  ? fs.readdirSync(_featuresDir, { withFileTypes: true })
      .filter((e) => e.isDirectory()).map((e) => e.name).sort()
  : [];
const _loaded = _all.filter((f) => env.isFeatureEnabled(f));
const _skipped = _all.filter((f) => !env.isFeatureEnabled(f));
console.log(`🚀 env=${env.nodeEnv} features=[${_loaded.join(",")}]`);
console.log(`🚀 skipped (not in FEATURES): ${_skipped.length ? _skipped.join(",") : "-"}`);
if (env.features !== null) {
  const unknown = env.features.filter((f) => !_all.includes(f));
  if (unknown.length) console.warn(`🚀 WARNING: FEATURES lists unknown feature(s): ${unknown.join(",")}`);
}

// ---------- Initialize Sequelize instances (env-resolved) ----------
const dbCfg = env.selectDb();
const instances = {};                              // { app, omop?, … } by feature name
for (const [name, cfg] of Object.entries(dbCfg)) instances[name] = new Sequelize(cfg);
const sequelize_app = instances.app;
const _dedicated = Object.keys(instances).filter((n) => n !== "app");
console.log(`🚀 dedicated DBs: ${_dedicated.length ? _dedicated.join(",") : "-"}`);

// Core (cross-cutting) models live alongside this file; legacy per-feature
// models live in subfolders under server/models/. Single recursive scan picks
// up both. loadSequelizeModels skips this index.js via the `basename` guard.
loadSequelizeModels({
  directory: __dirname,
  db,
  basename,
  instances,
});

// Migrated features under features/<name>/models/ (bound by feature name).
loadFeatureModels({
  directory: __dirname,
  featuresDir: path.join(__dirname, "..", "features"),
  db,
  instances,
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// ------------------------ App relations ------------------------

db.feature.hasMany(db.featureUser);
db.user.hasMany(db.featureUser, { onDelete: "cascade", hooks: true });
db.featureUser.belongsTo(db.user);
db.user.belongsToMany(db.feature, {
  through: db.featureUser,
  sourceKey: "id",
  targetKey: "id",
});
db.feature.belongsToMany(db.user, {
  through: db.featureUser,
  sourceKey: "id",
  targetKey: "id",
});
db.user.hasMany(db.log);
db.log.belongsTo(db.user);

//------------------------ Features relations ------------------------

loadRelations({ directory: __dirname, db });
loadFeatureRelations({ featuresDir: path.join(__dirname, "..", "features"), db });

for (const [name, inst] of Object.entries(instances)) db[`sequelize_${name}`] = inst;
// Explicit null (not undefined) for any feature DB that's disabled, so `db`
// has a stable shape regardless of FEATURES.
for (const name of env.featureDbNames) db[`sequelize_${name}`] = db[`sequelize_${name}`] || null;
db.Sequelize = Sequelize;

module.exports = db;