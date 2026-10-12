const db = require("../../../models");
const {
  getAttributes,
  getPaginationAndSort,
  buildWhereClause,
} = require("./_helper");

exports.findAll = (attrs, page, pageSize, sortOrder) => {
  const { order, offset, limit } = getPaginationAndSort(
    page,
    pageSize,
    sortOrder,
    "observation_id",
  );
  return db.observation.findAll({
    attributes: getAttributes(attrs, "observation"),
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
    "observation_id",
  );

  const where = buildWhereClause(searchParams);

  return db.observation.findAll({
    where,
    attributes: getAttributes(attrs, "observation"),
    order,
    offset,
    limit,
  });
};

exports.countBySearch = (searchParams) => {
  const where = buildWhereClause(searchParams);
  return db.observation.count({ where });
};

exports.countAll = () => db.observation.count();
