const svc = require("../services/cohort_definition");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("cohort_definition", svc);

exports.findAll = cachedList;
exports.search = cachedList;
