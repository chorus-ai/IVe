const svc = require("../services/visit_detail");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("visit_detail", svc);

exports.findAll = cachedList;
exports.search = cachedList;
