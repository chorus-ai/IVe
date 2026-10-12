const vocabConceptServices = require("../services/concept");

exports.findAll = (req, res) => {
  const { table, column, page, pageSize, order, vocabulary_id, concept_class_id, concept_code } = req.query;
  vocabConceptServices
    .findAll(table, column, page, pageSize, order, vocabulary_id, concept_class_id, concept_code)
    .then((result) => res.status(200).json(result))
    .catch((err) => {
      res.status(500).send({
        message: err.message,
      });
    });

};

exports.findById = (req, res) => {
  const { cid } = req.params;

  vocabConceptServices
    .findById(cid)
    .then((result) => {
      if (result)
        return res.status(200).json(result)
      return res.status(404).send({ "message": "Concept not found." })
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message,
      });
    });
};

exports.searchByName = (req, res) => {
  const { name, table, column, page, pageSize, exactMatch = false, order, vocabulary_id, concept_class_id, concept_code } = req.query;

  vocabConceptServices
    .searchByName(name, table, column, parseInt(page), parseInt(pageSize), JSON.parse(exactMatch), order, vocabulary_id, concept_class_id, concept_code)
    .then((result) => {
      if (result && result.length > 0)
        return res.status(200).json(result)
      return res.status(404).send({ "message": "No concept found." })
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message,
      });
    });
};