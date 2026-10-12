const svc = require("../services/death");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("death", svc);

exports.findAll = cachedList;
exports.search = cachedList;
