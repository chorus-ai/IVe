const db = require("../../../models");
const {
  getAttributes,
  getPaginationAndSort,
  buildWhereClause,
} = require("./_helper");

/* --------------------------------------------------------------------- */
/*  basic fetch helpers                                                  */
/* --------------------------------------------------------------------- */

exports.findById = (pid) => db.person.findByPk(pid);

exports.findAll = (attrs, page, pageSize, sortOrder) => {
  const { order, offset, limit } = getPaginationAndSort(
    page,
    pageSize,
    sortOrder,
    "person_id",
  );
  return db.person.findAll({
    attributes: getAttributes(attrs, "person"),
    order,
    offset,
    limit,
  });
};

/* --------------------------------------------------------------------- */
/*  ADVANCED SEARCH                                                      */
/* --------------------------------------------------------------------- */
exports.advancedSearch = (searchParams, attrs, page, pageSize, sortOrder) => {
  const { order, offset, limit } = getPaginationAndSort(
    page,
    pageSize,
    sortOrder,
    "person_id",
  );

  const where = buildWhereClause(searchParams);

  return db.person.findAll({
    where,
    attributes: getAttributes(attrs, "person"),
    order,
    offset,
    limit,
  });
};

exports.countAll = () => db.person.count();

exports.countBySearch = (searchParams) => {
  const where = buildWhereClause(searchParams);
  return db.person.count({ where });
};
