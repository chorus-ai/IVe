/** HTTP surface for WFDB decoding. Thin: input, service call, response. */

const wfdbService = require("../services/wfdb");

const fail = (res, err) => {
  const status = err.status || 500;
  res.status(status).send(
    err.problem || {
      type: "internal-error",
      title: "Waveform request failed",
      detail: err.message,
      status,
    }
  );
};

/** GET /api/waveform/wfdb?filename=<bucket path>&offset=<sec>&range=<sec> */
exports.read = async (req, res) => {
  try {
    const { filename, offset, range } = req.query;
    res.send(await wfdbService.read({ filename, offset, range }));
  } catch (err) {
    fail(res, err);
  }
};
