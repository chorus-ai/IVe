const widgetService = require("../services/widget");

/* ----------  LIST ---------- */
exports.findAll = (req, res) => {
  const { type, page, pageSize, sortOrder } = req.query;
  widgetService
    .findAll(type, page, pageSize, sortOrder)
    .then((widgets) => res.status(200).json(widgets))
    .catch((err) => res.status(500).json({ message: err.message }));
};

/* ----------  GET BY ID ---------- */
exports.findById = (req, res) => {
  widgetService
    .findById(req.params.widget_id)
    .then((w) =>
      w ? res.status(200).json(w)
        : res.status(404).json({ message: "Widget not found" })
    )
    .catch((err) => res.status(500).json({ message: err.message }));
};

/* ----------  CREATE ---------- */
exports.create = (req, res) => {
  widgetService
    .create({ userId: req.user.id, ...req.body })
    .then((w) => res.status(201).json(w))
    .catch((err) => res.status(500).json({ message: err.message }));
};

/* ----------  UPDATE ---------- */
exports.update = (req, res) => {
  widgetService
    .update(req.params.widget_id, req.user.id, req.body)
    .then(([rows]) =>
      rows ? res.status(200).json({ updated: rows })
           : res.status(404).json({ message: "Widget not found" })
    )
    .catch((err) => res.status(500).json({ message: err.message }));
};

/* ----------  DELETE ---------- */
exports.remove = (req, res) => {
  widgetService
    .remove(req.params.widget_id, req.user.id)
    .then((rows) =>
      rows ? res.status(204).end()
           : res.status(404).json({ message: "Widget not found" })
    )
    .catch((err) => res.status(500).json({ message: err.message }));
};

/* ----------  SEARCH ---------- */
exports.searchByName = (req, res) => {
  const { page, pageSize, sortOrder } = req.query;
  const { name } = req.body;
  widgetService
    .searchByName(name, page, pageSize, sortOrder)
    .then((widgets) =>
      widgets.length
        ? res.status(200).json(widgets)
        : res.status(404).json({ message: "No widgets match your query" })
    )
    .catch((err) => res.status(500).json({ message: err.message }));
};
