const svc = require("../services/drug_exposure");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("drug_exposure", svc);

exports.findAll = cachedList;
exports.search = cachedList;
