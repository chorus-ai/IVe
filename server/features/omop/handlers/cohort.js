const svc = require("../services/cohort");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("cohort", svc);

exports.findAll = cachedList;
exports.search = cachedList;
