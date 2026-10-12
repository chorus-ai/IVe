// services/ive/layout.js

const db = require("../../../models");
const { Op } = require("sequelize");

const ORDERS = ["ASC", "DESC"];
const DEFAULT_SORT = [["id", "DESC"]];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 1000;

function getPaginationAndSort(page, pageSize, sortOrder) {
  const pageNum = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || DEFAULT_PAGE_SIZE;

  const order = ORDERS.includes((sortOrder || "").toUpperCase())
    ? [["id", sortOrder]]
    : DEFAULT_SORT;

  const limit = size > 0 && size <= MAX_PAGE_SIZE ? size : DEFAULT_PAGE_SIZE;
  const offset = (pageNum - 1) * limit;

  return { order, offset, limit };
}

/**
 * 1. List all layout configurations
 */
exports.findAll = async (page, pageSize, sortOrder) => {
  const { order, offset, limit } = getPaginationAndSort(page, pageSize, sortOrder);

  return db.iveLayout.findAll({
    order,
    offset,
    limit
  });
};

/**
 * 2. Get a layout configuration by ID
 */
exports.findById = async (layoutId) => {
  return db.iveLayout.findByPk(layoutId);
};

/**
 * 3. Create a new layout configuration
 */
exports.createLayout = async (userId, name, config) => {
  const configStr = typeof config === "string" ? config : JSON.stringify(config);
  return db.iveLayout.create({ userId, name, config: configStr });
};

/**
 * 4. Update an existing layout configuration
 */
exports.updateLayout = async (layoutId, userId, name, config) => {
  const configStr = typeof config === "string" ? config : JSON.stringify(config);
  const [rowsAffected] = await db.iveLayout.update(
    { name, config: configStr },
    { where: { id: layoutId, userId } }
  );
  if (rowsAffected === 0) {
    return null;
  }
  return db.iveLayout.findByPk(layoutId);
};

/**
 * 5. Delete a layout configuration
 */
exports.deleteLayout = async (layoutId, userId) => {
  const rowsDeleted = await db.iveLayout.destroy({
    where: { id: layoutId, userId }
  });
  return rowsDeleted;
};

/**
 * Deserialize config back to array
 */
exports.serializeOut = (layout) => {
  if (!layout) return layout;
  const v = layout.toJSON ? layout.toJSON() : layout;
  try { v.config = typeof v.config === "string" ? JSON.parse(v.config) : v.config; } catch {}
  return v;
};

/**
 * 6. Search for layouts by name
 */
exports.searchByName = async (name, page, pageSize, sortOrder) => {
  const { order, offset, limit } = getPaginationAndSort(page, pageSize, sortOrder);
  if (!name) {
    return db.iveLayout.findAll({ order, offset, limit });
  }
  return db.iveLayout.findAll({
    where: {
      name: {
        [Op.like]: `%${name}%`
      }
    },
    order,
    offset,
    limit
  });
};
