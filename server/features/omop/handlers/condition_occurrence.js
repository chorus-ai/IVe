const svc = require("../services/condition_occurrence");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("condition_occurrence", svc);

exports.findAll = cachedList;
exports.search = cachedList;
