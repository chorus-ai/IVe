const express = require('express');
const fs = require('fs');
const path = require('path');
const { loadRoutes } = require('../utils/router');
const env = require('../config/env');
const basename = path.basename(__filename);
const router = express.Router();

// Legacy flat routes under routes/<feature>/... (mounted at /api/<feature>/...).
loadRoutes(router, __dirname, __dirname);

// Migrated features: features/<name>/routes/* mounted at /api/<name>/*.
const featuresDir = path.join(__dirname, '..', 'features');
if (fs.existsSync(featuresDir)) {
  fs.readdirSync(featuresDir, { withFileTypes: true }).forEach((entry) => {
    if (!entry.isDirectory()) return;
    if (!env.isFeatureEnabled(entry.name)) return; // FEATURES allowlist
    const routesDir = path.join(featuresDir, entry.name, 'routes');
    if (!fs.existsSync(routesDir)) return;
    const featureRouter = express.Router();
    loadRoutes(featureRouter, routesDir, routesDir);
    // A feature whose resource sits at the feature root uses routes/index.js
    // (loadRoutes skips index.js); mount it at the feature router root so the
    // URL stays /api/<feature> with no extra segment.
    const featureIndex = path.join(routesDir, 'index.js');
    if (fs.existsSync(featureIndex)) featureRouter.use('/', require(featureIndex));
    router.use('/' + entry.name, featureRouter);
  });
}

module.exports = router;
