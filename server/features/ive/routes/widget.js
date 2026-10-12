const express = require("express");
const router  = express.Router();
const h       = require("../handlers/widget");
const tagHandler = require("../handlers/tag");
const widgetTags = tagHandler.forResource("widget", "widget_id");

// GET    /api/ive/widget                                 — list all widgets (or filter by ?tag=:slug)
router.get("/", (req, res, next) =>
  req.query.tag ? widgetTags.listByTag(req, res) : h.findAll(req, res, next)
);

// POST   /api/ive/widget                                 — create a widget
router.post("/", h.create);

// POST   /api/ive/widget/search                          — search widgets by name
router.post("/search", h.searchByName);

// POST   /api/ive/widget/:widget_id/tags                 — attach tags (merge)
router.post("/:widget_id/tags", widgetTags.add);

// PUT    /api/ive/widget/:widget_id/tags                 — replace tag set
router.put("/:widget_id/tags", widgetTags.set);

// DELETE /api/ive/widget/:widget_id/tags/:tagId          — detach a tag
router.delete("/:widget_id/tags/:tagId", widgetTags.remove);

// GET    /api/ive/widget/:widget_id                      — get a widget by id
router.get("/:widget_id", h.findById);

// PUT    /api/ive/widget/:widget_id                      — update a widget by id
router.put("/:widget_id", h.update);

// DELETE /api/ive/widget/:widget_id                      — delete a widget by id
router.delete("/:widget_id", h.remove);

module.exports = router;
