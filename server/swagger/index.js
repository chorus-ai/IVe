"use strict";

require("dotenv").config();
const path = require("path");
const coreSpec = require("./swagger.json");
const { loadFeatureSwaggers } = require("../utils/feature");

// Core spec's static parts (tags/paths/components) live in swagger.json,
// same shape as every features/<name>/swagger.json. info/servers stay here
// since they need env vars resolved at request time, not build time.
const spec = {
  ...coreSpec,
  info: {
    title: `${process.env.APP_NAME} API`,
    version: process.env.APP_VERSION,
    description: `API documentation for ${process.env.APP_NAME} features`,
  },
  servers: [
    { url: `${process.env.APP_HOST}/api`, description: `${process.env.NODE_ENV} server` },
  ],
};

loadFeatureSwaggers({ featuresDir: path.join(__dirname, "..", "features"), spec });

module.exports = spec;
