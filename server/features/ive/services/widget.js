const db = require("../../../models");
const { Op } = require("sequelize");
const {
  getPaginationAndSort,
  buildTextFilter,
} = require("../../omop/services/_helper");

/* ─────────── CRUD + SEARCH ─────────── */

exports.findAll = (type, page, pageSize, sortOrder) => {
  const { order, offset, limit } = getPaginationAndSort(
    page, pageSize, sortOrder, "id"
  );
  const where = type ? { type } : undefined;
  return db.iveWidget.findAll({ where, order, offset, limit });
};

exports.findById = (widgetId) => db.iveWidget.findByPk(widgetId);

exports.create = (payload) => db.iveWidget.create(payload);

exports.update = (widgetId, userId, payload) =>
  db.iveWidget.update(payload, { where: { id: widgetId, userId } });

exports.remove = (widgetId, userId) =>
  db.iveWidget.destroy({ where: { id: widgetId, userId } });

exports.searchByName = (name, page, pageSize, sortOrder) => {
  if (!name) return Promise.resolve([]);
  const { order, offset, limit } = getPaginationAndSort(
    page, pageSize, sortOrder, "id"
  );
  const nameFilter = buildTextFilter(name);
  return db.iveWidget.findAll({
    where: { name: nameFilter },
    order,
    offset,
    limit,
  });
};
