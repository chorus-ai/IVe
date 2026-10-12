const svc = require("../services/visit_occurrence");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("visit_occurrence", svc);

exports.findAll = cachedList;
exports.search = cachedList;
