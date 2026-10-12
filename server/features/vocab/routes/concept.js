const express = require("express");
const router = express.Router();
const h = require("../handlers/concept");

router.get("/",             h.findAll);
router.get("/:cid(\\d+)",   h.findById);
router.get("/search",       h.searchByName);

module.exports = router;
