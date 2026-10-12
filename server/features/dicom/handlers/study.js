/** HTTP surface for the study index. Thin: input, service call, response. */

const studyService = require("../services/study");

const fail = (res, err) => {
  const status = err.status || 500;
  res.status(status).send(
    err.problem || {
      type: "internal-error",
      title: "DICOM request failed",
      detail: err.message,
      status,
    }
  );
};

/** GET /api/dicom/studies */
exports.list = async (req, res) => {
  try {
    res.send(await studyService.listStudies());
  } catch (err) {
    fail(res, err);
  }
};

/** GET /api/dicom/studies/:id — study → series → instances, sorted. */
exports.get = async (req, res) => {
  try {
    res.send(await studyService.getStudyIndex(req.params.id));
  } catch (err) {
    fail(res, err);
  }
};
