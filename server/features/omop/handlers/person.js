const svc = require("../services/person");
const { createCachedListHandler } = require("../services/_search-handler");

const cachedList = createCachedListHandler("person", svc);

exports.findAll = cachedList;
exports.search = cachedList;

exports.findById = (req, res) => {
  const { pid } = req.params;
  svc.findById(pid)
    .then((result) => {
      if (result) return res.status(200).json(result);
      return res.status(404).json({ message: "Not found." });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
};
