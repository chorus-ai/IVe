const express = require("express");
const router = express.Router();
const wfdbHandler = require("../handlers/wfdb");

// Mounts at /api/waveform/wfdb (filename -> path).
router.get("/", wfdbHandler.read);

module.exports = router;
