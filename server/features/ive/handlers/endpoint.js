const endpointService = require("../services/endpoint");

const out = (x) => (Array.isArray(x) ? x.map(endpointService.serializeOut) : endpointService.serializeOut(x));

exports.listByUser = (req, res) => {
  const { uid } = req.params;
  const { page, pageSize, sortOrder } = req.query;
  endpointService
    .listByUser(uid, page, pageSize, sortOrder)
    .then((rows) => res.status(200).json(out(rows)))
    .catch((err) => res.status(err.status || 500).json({ message: err.message }));
};

exports.listVisible = (req, res) => {
  const { page, pageSize, sortOrder } = req.query;
  endpointService
    .listVisible(req.user.id, page, pageSize, sortOrder)
    .then((rows) => res.status(200).json(out(rows)))
    .catch((err) => res.status(err.status || 500).json({ message: err.message }));
};

exports.getById = (req, res) => {
  const { id } = req.params;
  endpointService
    .getById(id)
    .then((row) => {
      if (!row) return res.status(404).json({ message: `No endpoint id=${id}` });
      return res.status(200).json(out(row));
    })
    .catch((err) => res.status(500).json({ message: err.message }));
};

exports.getByTag = (req, res) => {
  const { tagName } = req.params;
  const { page, pageSize, sortOrder } = req.query;
  endpointService
    .getByTag(tagName, page, pageSize, sortOrder)
    .then((rows) => {
      if (!rows || !rows.length) return res.status(404).json({ message: `No endpoints for tag=${tagName}` });
      return res.status(200).json(out(rows));
    })
    .catch((err) => res.status(500).json({ message: err.message }));
};

exports.create = (req, res) => {
  endpointService
    .create({ userId: req.user.id, ...req.body })
    .then((row) => res.status(201).json(out(row)))
    .catch((err) => res.status(err.status || 500).json({ message: err.message }));
};

exports.deleteById = (req, res) => {
  const { id } = req.params;
  endpointService
    .deleteById(id, req.user.id)
    .then((n) => {
      if (!n) return res.status(404).json({ message: `No endpoint id=${id}` });
      return res.status(204).send();
    })
    .catch((err) => res.status(500).json({ message: err.message }));
};

exports.updateById = (req, res) => {
  const { id } = req.params;
  endpointService
    .updateById(id, req.user.id, req.body || {})
    .then((row) => {
      if (!row) return res.status(404).json({ message: `No endpoint id=${id}` });
      return res.status(200).json(out(row));
    })
    .catch((err) => res.status(500).json({ message: err.message }));
};
