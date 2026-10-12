const db = require("../../../models");

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RESOURCE_MAP = {
  layout:   { model: "iveLayout",   alias: "iveTags" },
  widget:   { model: "iveWidget",   alias: "iveTags" },
  endpoint: { model: "iveEndpoint", alias: "iveTags" },
};

const badRequest = (msg) => {
  const e = new Error(msg);
  e.status = 400;
  return e;
};
const notFound = (msg) => {
  const e = new Error(msg);
  e.status = 404;
  return e;
};

const validateSlug = (slug) => {
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    throw badRequest(`Invalid slug: "${slug}". Must match ${SLUG_RE}`);
  }
  return slug;
};

const validateSlugs = (slugs) => {
  if (!Array.isArray(slugs)) throw badRequest("`slugs` must be an array of strings");
  return [...new Set(slugs.map(validateSlug))];
};

// Find-or-create one tag by slug
const upsertTag = async (slug) => {
  validateSlug(slug);
  const [tag] = await db.iveTag.findOrCreate({ where: { slug }, defaults: { slug } });
  return tag;
};

// Bulk find-or-create
const upsertTags = async (slugs) => {
  const uniq = validateSlugs(slugs);
  if (!uniq.length) return [];
  const existing = await db.iveTag.findAll({ where: { slug: uniq } });
  const have = new Set(existing.map((t) => t.slug));
  const missing = uniq.filter((s) => !have.has(s));
  if (missing.length) {
    await db.iveTag.bulkCreate(missing.map((slug) => ({ slug })), { ignoreDuplicates: true });
  }
  return db.iveTag.findAll({ where: { slug: uniq } });
};

// Shared so other services (e.g. endpoint) can attach tags via the join table
exports.upsertTags = upsertTags;

// ---------- Tag CRUD ----------

exports.createTag = async ({ slug }) => {
  validateSlug(slug);
  try {
    return await db.iveTag.create({ slug });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const e = new Error(`Tag "${slug}" already exists`);
      e.status = 409;
      throw e;
    }
    throw err;
  }
};

exports.listTags = () => db.iveTag.findAll({ order: [["slug", "ASC"]] });

exports.getTagBySlug = async (slug) => {
  validateSlug(slug);
  const tag = await db.iveTag.findOne({ where: { slug } });
  if (!tag) throw notFound(`No tag slug=${slug}`);
  return tag;
};

exports.deleteTagById = async (id) => {
  const n = await db.iveTag.destroy({ where: { id } });
  if (!n) throw notFound(`No tag id=${id}`);
  return n;
};

// ---------- Per-resource tag ops ----------

const getResourceOrThrow = async (resource, id) => {
  const def = RESOURCE_MAP[resource];
  if (!def) throw badRequest(`Unknown resource "${resource}"`);
  const row = await db[def.model].findByPk(id, { include: [{ model: db.iveTag }] });
  if (!row) throw notFound(`No ${resource} id=${id}`);
  return row;
};

// POST: add (merge) tags
exports.addTagsToResource = async (resource, id, slugs) => {
  const row = await getResourceOrThrow(resource, id);
  const tags = await upsertTags(slugs);
  await row.addIveTags(tags);
  return row.reload({ include: [{ model: db.iveTag }] });
};

// PUT: replace full tag set
exports.setTagsOnResource = async (resource, id, slugs) => {
  const row = await getResourceOrThrow(resource, id);
  const tags = await upsertTags(slugs);
  await row.setIveTags(tags);
  return row.reload({ include: [{ model: db.iveTag }] });
};

// DELETE: detach a single tag by tag id
exports.removeTagFromResource = async (resource, id, tagId) => {
  const row = await getResourceOrThrow(resource, id);
  const tag = await db.iveTag.findByPk(tagId);
  if (!tag) throw notFound(`No tag id=${tagId}`);
  await row.removeIveTag(tag);
  return row.reload({ include: [{ model: db.iveTag }] });
};

// GET ?tag=:slug for a resource collection
exports.listResourcesByTag = async (resource, slug) => {
  validateSlug(slug);
  const def = RESOURCE_MAP[resource];
  if (!def) throw badRequest(`Unknown resource "${resource}"`);
  const tag = await db.iveTag.findOne({
    where: { slug },
    include: [{
      model: db[def.model],
      through: { attributes: [] },
      include: [{ model: db.iveTag, through: { attributes: [] } }],
    }],
  });
  if (!tag) return [];
  return tag[def.model + "s"] || [];
};

// GET /tag/:slug/resources — fan-out across all resource types
exports.listAllResourcesForTag = async (slug) => {
  validateSlug(slug);
  const tag = await db.iveTag.findOne({
    where: { slug },
    include: [
      { model: db.iveLayout,   through: { attributes: [] } },
      { model: db.iveWidget,   through: { attributes: [] } },
      { model: db.iveEndpoint, through: { attributes: [] } },
    ],
  });
  if (!tag) throw notFound(`No tag slug=${slug}`);
  return {
    tag: { id: tag.id, slug: tag.slug },
    layouts:   tag.iveLayouts   || [],
    widgets:   tag.iveWidgets   || [],
    endpoints: tag.iveEndpoints || [],
  };
};

exports.serializeTag = (t) => (t ? { id: t.id, slug: t.slug } : t);
