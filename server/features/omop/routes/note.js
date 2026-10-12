const express = require("express");
const router  = express.Router();
const h       = require("../handlers/note");

router.get ("/",                                    h.findAll);
router.post("/search",                              h.search);

module.exports = router;
