"use strict";

// Boots a BullMQ Worker for every enabled feature that ships a jobs/index.js.
// Each feature's index module exports:
//   - name:          string  (queue name)
//   - process:       async fn(job)
//   - concurrency?:  number
//   - onCompleted?:  fn(job)
//   - onFailed?:     fn(job, err)
//
// FEATURES env gating is honoured so this matches what the API server loads.

const fs = require("fs");
const path = require("path");
const { Worker } = require("bullmq");
const { connection } = require("./utils/queue");
const env = require("./config/env");

const featuresDir = path.join(__dirname, "features");
fs.readdirSync(featuresDir, { withFileTypes: true }).forEach((entry) => {
  if (!entry.isDirectory() || !env.isFeatureEnabled(entry.name)) return;
  const jobsIndex = path.join(featuresDir, entry.name, "jobs", "index.js");
  if (!fs.existsSync(jobsIndex)) return;

  const { name, process, concurrency, onCompleted, onFailed } = require(jobsIndex);
  const worker = new Worker(name, process, { connection, concurrency });

  worker.on("completed", (job) => {
    console.info(`[${name}] ${job.id} completed`);
    if (onCompleted) onCompleted(job);
  });
  worker.on("failed", (job, err) => {
    console.error(`[${name}] ${job?.id} failed: ${err?.message}`);
    if (onFailed) onFailed(job, err);
  });

  console.log(`[worker] registered ${entry.name} -> ${name}`);
});
