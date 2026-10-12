// routes/ive/layout.js
const express = require("express");
const router = express.Router();
const layoutHandler = require("../handlers/layout");
const tagHandler = require("../handlers/tag");
const layoutTags = tagHandler.forResource("layout", "layout_id");

// GET    /api/ive/layout                                 — list all layouts (or filter by ?tag=:slug)
router.get("/", (req, res, next) =>
  req.query.tag ? layoutTags.listByTag(req, res) : layoutHandler.findAll(req, res, next)
);

// POST   /api/ive/layout                                 — create a layout
router.post("/", layoutHandler.create);

// POST   /api/ive/layout/search                          — search layouts by name
router.post("/search", layoutHandler.searchByName);

// POST   /api/ive/layout/:layout_id/tags                 — attach tags (merge)
router.post("/:layout_id/tags", layoutTags.add);

// PUT    /api/ive/layout/:layout_id/tags                 — replace tag set
router.put("/:layout_id/tags", layoutTags.set);

// DELETE /api/ive/layout/:layout_id/tags/:tagId          — detach a tag
router.delete("/:layout_id/tags/:tagId", layoutTags.remove);

// GET    /api/ive/layout/:layout_id                      — get a layout by id
router.get("/:layout_id", layoutHandler.findById);

// PUT    /api/ive/layout/:layout_id                      — update a layout by id
router.put("/:layout_id", layoutHandler.update);

// DELETE /api/ive/layout/:layout_id                      — delete a layout by id
router.delete("/:layout_id", layoutHandler.delete);

module.exports = router;
