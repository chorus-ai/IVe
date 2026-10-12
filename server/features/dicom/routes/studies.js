const express = require("express");
const router = express.Router();
const studyHandler = require("../handlers/study");

// Mounts at /api/dicom/studies (filename -> path).
router.get("/", studyHandler.list);
router.get("/:id", studyHandler.get);

module.exports = router;
