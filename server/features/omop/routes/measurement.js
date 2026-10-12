const express = require("express");
const router  = express.Router();
const h       = require("../handlers/measurement");

router.get ("/",                                    h.findAll);
router.post("/search",                              h.search);

module.exports = router;
