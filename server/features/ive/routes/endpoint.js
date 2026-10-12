const express = require("express");
const router = express.Router();
const ctrl = require("../handlers/endpoint");
const tagHandler = require("../handlers/tag");
const endpointTags = tagHandler.forResource("endpoint", "id");

// GET    /api/ive/endpoint                               — list endpoints visible to the caller (mine + public),
//                                                         or filter by ?tag=:slug via the join table
router.get("/", (req, res) => {
  if (req.query.tag) return endpointTags.listByTag(req, res);
  return ctrl.listVisible(req, res);
});

// POST   /api/ive/endpoint                               — create a saved endpoint
router.post("/", ctrl.create);

// GET    /api/ive/endpoint/users/:uid                    — list saved endpoints by user id
router.get("/users/:uid", ctrl.listByUser);

// GET    /api/ive/endpoint/tags/:tagName                 — list endpoints by tag slug via the join table (back-compat path)
router.get("/tags/:tagName", ctrl.getByTag);

// POST   /api/ive/endpoint/:id/tags                      — attach tags (merge)
router.post("/:id/tags", endpointTags.add);

// PUT    /api/ive/endpoint/:id/tags                      — replace tag set
router.put("/:id/tags", endpointTags.set);

// DELETE /api/ive/endpoint/:id/tags/:tagId               — detach a tag
router.delete("/:id/tags/:tagId", endpointTags.remove);

// GET    /api/ive/endpoint/:id                           — get a saved endpoint by id
router.get("/:id", ctrl.getById);

// PUT    /api/ive/endpoint/:id                           — update a saved endpoint by id
router.put("/:id", ctrl.updateById);

// DELETE /api/ive/endpoint/:id                           — delete a saved endpoint by id
router.delete("/:id", ctrl.deleteById);

module.exports = router;
