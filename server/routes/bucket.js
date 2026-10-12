const express = require("express");
const router = express.Router();
const bucketHandler = require("../handler/bucket");

// ---- S3 endpoints (must be declared BEFORE the catch-all /* below) ----

// Health check
router.get("/s3/health", bucketHandler.health);
// List files in bucket with page, pageSize
router.get("/s3/list/:prefix(*)", bucketHandler.listObjects);
// Read file from bucket by key
router.get("/s3/read/:key(*)", bucketHandler.readFile);
// Upload file to bucket
router.post("/s3/upload", bucketHandler.uploadFile);
// Download file from bucket
router.get("/s3/download", bucketHandler.downloadFile);
// Delete file from bucket
router.delete("/s3/delete", bucketHandler.deleteFile);

// Find all bucket files and folders with given path (catch-all — keep last)
router.get("/*", bucketHandler.findAll);

module.exports = router;
