const express = require("express");
const router = express.Router();
const h = require("../handler/status");

router.get("/:key", h.getStatus);
router.delete("/:key", h.purge);

module.exports = router;
