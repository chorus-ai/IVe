const express = require("express");
const router = express.Router();
const ctrl = require("../handlers/tag");

// POST /api/ive/tag        — create tag
router.post("/", ctrl.create);

// GET  /api/ive/tag        — list all tags
router.get("/", ctrl.list);

// GET  /api/ive/tag/:slug/resources  — fan-out: layouts + widgets + endpoints
router.get("/:slug/resources", ctrl.getResourcesForSlug);

// GET  /api/ive/tag/:slug  — get tag by slug
router.get("/:slug", ctrl.getBySlug);

// DELETE /api/ive/tag/:id  — delete tag by id
router.delete("/:id", ctrl.deleteById);

module.exports = router;
