const svc = require("../services/procedure_occurrence");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("procedure_occurrence", svc);

exports.findAll = cachedList;
exports.search = cachedList;
