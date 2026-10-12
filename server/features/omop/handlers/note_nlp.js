const svc = require("../services/note_nlp");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("note_nlp", svc);

exports.findAll = cachedList;
exports.search = cachedList;
