const express = require("express");
const router = express.Router();
const instanceHandler = require("../handlers/instance");

// Mounts at /api/dicom/instances (filename -> path).
router.get("/:id/metadata", instanceHandler.metadata);
router.get("/:id/file", instanceHandler.file);
router.get("/:id/preview", instanceHandler.preview);
router.get("/:id/phi-scan", instanceHandler.phiScan);

module.exports = router;
