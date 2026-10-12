const svc = require("../services/observation_period");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("observation_period", svc);

exports.findAll = cachedList;
exports.search = cachedList;
