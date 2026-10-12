/**
 * Adapter for the Python scripts in python-scripts/.
 *
 * Node ↔ Python is an API boundary: a script takes positional args and prints
 * one JSON document on stdout. This module owns the generic half of that —
 * spawning, timeout, stderr, exit codes, JSON parsing — so features keep only
 * the script-specific half (which args, what the result means).
 *
 * features/cada/handlers/file.js predates this and still spawns inline,
 * piping raw stdout+stderr to the response; it is a candidate to move here.
 */

const path = require("path");
const { spawn } = require("child_process");
const env = require("../config/env");

const SCRIPTS_DIR = path.join(__dirname, "../python-scripts");
const STDERR_LIMIT = 16 * 1024;

class PythonError extends Error {
  constructor(status, title, detail) {
    super(detail);
    this.name = "PythonError";
    this.status = status;
    this.problem = { type: "python-error", title, detail, status };
  }
}

/**
 * Run python-scripts/<script> with args and resolve its stdout parsed as JSON.
 *
 * Rejects with a PythonError carrying an HTTP-ready `problem`:
 *   503  PYTHON_PATH unset, or the interpreter could not be started
 *   504  the script outlived timeoutMs (it is killed)
 *   422  the script exited non-zero — usually unreadable input
 *   502  the script exited 0 but stdout was not JSON (a contract break)
 *
 * stderr is logged in full but only its last line reaches the caller, so a
 * traceback's file paths stay server-side.
 */
const runJson = (script, args = [], { timeoutMs = 60000 } = {}) =>
  new Promise((resolve, reject) => {
    if (!env.pythonPath) {
      return reject(new PythonError(503, "Python unavailable", "PYTHON_PATH is unset."));
    }

    const child = spawn(env.pythonPath, [path.join(SCRIPTS_DIR, script), ...args.map(String)], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const out = [];
    let err = "";
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      settle(reject, new PythonError(504, "Python script timed out", `${script} exceeded ${timeoutMs} ms.`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => out.push(chunk));
    child.stderr.on("data", (chunk) => {
      if (err.length < STDERR_LIMIT) err += chunk.toString();
    });

    child.on("error", (e) => {
      settle(reject, new PythonError(503, "Python unavailable", `Could not start ${env.pythonPath}: ${e.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        if (err) console.error(`[python] ${script} exited ${code}:\n${err}`);
        const lastLine = err.trim().split("\n").pop() || `exit code ${code}`;
        return settle(reject, new PythonError(422, `${script} failed`, lastLine));
      }
      try {
        settle(resolve, JSON.parse(Buffer.concat(out).toString()));
      } catch (e) {
        settle(reject, new PythonError(502, `${script} returned invalid JSON`, e.message));
      }
    });
  });

module.exports = { runJson, PythonError };
