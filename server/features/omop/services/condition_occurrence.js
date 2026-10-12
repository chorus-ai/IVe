const db = require("../../../models");
const {
  getAttributes,
  getPaginationAndSort,
  buildWhereClause,
} = require("./_helper");

const MODEL = "condition_occurrence";
const PK = "condition_occurrence_id";

exports.findAll = (attrs, page, pageSize, sortOrder) => {
  const { order, offset, limit } = getPaginationAndSort(
    page,
    pageSize,
    sortOrder,
    PK,
  );
  return db[MODEL].findAll({
    attributes: getAttributes(attrs, MODEL),
    order,
    offset,
    limit,
  });
};

exports.advancedSearch = (searchParams, attrs, page, pageSize, sortOrder) => {
  const { order, offset, limit } = getPaginationAndSort(
    page,
    pageSize,
    sortOrder,
    PK,
  );
  const where = buildWhereClause(searchParams);
  return db[MODEL].findAll({
    where,
    attributes: getAttributes(attrs, MODEL),
    order,
    offset,
    limit,
  });
};

exports.countAll = () => db[MODEL].count();

exports.countBySearch = (searchParams) => {
  const where = buildWhereClause(searchParams);
  return db[MODEL].count({ where });
};
