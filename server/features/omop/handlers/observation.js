const svc = require("../services/observation");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("observation", svc);

exports.findAll = cachedList;
exports.search = cachedList;
