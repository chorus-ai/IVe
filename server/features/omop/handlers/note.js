const svc = require("../services/note");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("note", svc);

exports.findAll = cachedList;
exports.search = cachedList;
