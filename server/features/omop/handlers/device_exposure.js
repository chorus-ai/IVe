const svc = require("../services/device_exposure");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("device_exposure", svc);

exports.findAll = cachedList;
exports.search = cachedList;
