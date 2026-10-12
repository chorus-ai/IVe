const express = require("express");
const router  = express.Router();
const h       = require("../handlers/person");

router.get ("/",                       h.findAll);        
router.post("/search",                 h.search);           
router.get ("/:pid(\\d+)",             h.findById);       

module.exports = router;
