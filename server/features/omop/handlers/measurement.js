const svc = require("../services/measurement");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("measurement", svc);

exports.findAll = cachedList;
exports.search = cachedList;
