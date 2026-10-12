const db = require("../../../models");
const { Op } = require("sequelize");
const { getPaginationAndSort } = require("../../omop/services/_helper");
const { upsertTags } = require("./tag");

const toJSONString = (v) => (v === undefined || v === null ? null : JSON.stringify(v));
const parseMaybeJSON = (v) => {
  try { return JSON.parse(v); } catch { return v; }
};

const include = [
  { model: db.user, as: "createdBy", attributes: ["id", "username", "email", "firstName", "lastName"] },
  { model: db.iveTag, through: { attributes: [] } },
];

// Normalize a `tags` body value into a slug array (accepts array, single string, or nullish)
const toSlugList = (tags) =>
  Array.isArray(tags) ? tags : (tags ? [].concat(tags) : []);

// Replace an endpoint row's tag set via the iveEndpointTag join table
const syncTags = async (row, tags) => {
  const tagRows = await upsertTags(toSlugList(tags));
  await row.setIveTags(tagRows);
};

exports.listByUser = (userId, page = 1, pageSize = 20, sortOrder = "desc") => {
  const { order, offset, limit } = getPaginationAndSort(page, pageSize, sortOrder, "id");
  return db.iveEndpoint.findAll({ where: { userId: userId }, order, offset, limit, include });
};

exports.listVisible = (userId, page = 1, pageSize = 20, sortOrder = "desc") => {
  const { order, offset, limit } = getPaginationAndSort(page, pageSize, sortOrder, "id");
  return db.iveEndpoint.findAll({
    where: { [Op.or]: [{ userId }, { isPublic: true }] },
    order, offset, limit, include,
  });
};

exports.getById = (id) => db.iveEndpoint.findByPk(id, { include });

exports.getByTag = async (tagName, page = 1, pageSize = 20, sortOrder = "desc") => {
  const { order, offset, limit } = getPaginationAndSort(page, pageSize, sortOrder, "id");
  const tag = await db.iveTag.findOne({ where: { slug: tagName } });
  if (!tag) return [];
  const links = await db.iveEndpointTag.findAll({
    where: { iveTagId: tag.id },
    attributes: ["iveEndpointId"],
  });
  const ids = links.map((l) => l.iveEndpointId);
  if (!ids.length) return [];
  return db.iveEndpoint.findAll({ where: { id: ids }, order, offset, limit, include });
};

exports.create = async ({ userId, endpoint, method = "POST", params, description, tags, isPublic, isCached }) => {
  if (!userId || !endpoint) {
    const err = new Error("userId and endpoint are required");
    err.status = 400;
    throw err;
  }
  const row = await db.iveEndpoint.create({
    userId: userId,
    endpoint,
    method,
    params: params != null ? toJSONString(params) : null,
    description: description || null,
    ...(typeof isPublic === "boolean" && { isPublic }),
    ...(typeof isCached === "boolean" && { isCached }),
  });
  if (tags !== undefined) await syncTags(row, tags);
  return db.iveEndpoint.findByPk(row.id, { include });
};

exports.deleteById = async (id, userId) => {
  return db.iveEndpoint.destroy({ where: { id, userId } });
};

exports.updateById = async (id, userId, { endpoint, method, params, description, tags, isPublic, isCached }) => {
  const patch = {};
  if (endpoint !== undefined) patch.endpoint = endpoint;
  if (method !== undefined) patch.method = method;
  if (params !== undefined) patch.params = toJSONString(params);
  if (description !== undefined) patch.description = description;
  if (typeof isPublic === "boolean") patch.isPublic = isPublic;
  if (typeof isCached === "boolean") patch.isCached = isCached;

  const row = await db.iveEndpoint.findOne({ where: { id, userId } });
  if (!row) return null;
  if (Object.keys(patch).length) await row.update(patch);
  if (tags !== undefined) await syncTags(row, tags);
  return db.iveEndpoint.findByPk(id, { include });
};

exports.serializeOut = (row) => {
  if (!row) return row;
  const v = row.toJSON ? row.toJSON() : row;
  delete v.userId;
  return {
    ...v,
    params: parseMaybeJSON(v.params),
  };
};
