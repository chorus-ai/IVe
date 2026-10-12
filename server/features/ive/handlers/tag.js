const tagService = require("../services/tag");

const fail = (res, err) =>
  res.status(err.status || 500).json({ message: err.message });

// ---------- Tag CRUD ----------

exports.create = (req, res) => {
  tagService
    .createTag({ slug: req.body && req.body.slug })
    .then((t) => res.status(201).json(tagService.serializeTag(t)))
    .catch((err) => fail(res, err));
};

exports.list = (req, res) => {
  tagService
    .listTags()
    .then((rows) => res.status(200).json(rows.map(tagService.serializeTag)))
    .catch((err) => fail(res, err));
};

exports.getBySlug = (req, res) => {
  tagService
    .getTagBySlug(req.params.slug)
    .then((t) => res.status(200).json(tagService.serializeTag(t)))
    .catch((err) => fail(res, err));
};

exports.deleteById = (req, res) => {
  tagService
    .deleteTagById(req.params.id)
    .then(() => res.status(204).send())
    .catch((err) => fail(res, err));
};

exports.getResourcesForSlug = (req, res) => {
  tagService
    .listAllResourcesForTag(req.params.slug)
    .then((data) => res.status(200).json(data))
    .catch((err) => fail(res, err));
};

// ---------- Per-resource handlers (factory) ----------

const extractSlugs = (req) => {
  const b = req.body || {};
  if (Array.isArray(b)) return b;
  if (Array.isArray(b.slugs)) return b.slugs;
  if (typeof b.slug === "string") return [b.slug];
  return [];
};

exports.forResource = (resource, idParam) => ({
  add: (req, res) =>
    tagService
      .addTagsToResource(resource, req.params[idParam], extractSlugs(req))
      .then((row) => res.status(200).json(row))
      .catch((err) => fail(res, err)),

  set: (req, res) =>
    tagService
      .setTagsOnResource(resource, req.params[idParam], extractSlugs(req))
      .then((row) => res.status(200).json(row))
      .catch((err) => fail(res, err)),

  remove: (req, res) =>
    tagService
      .removeTagFromResource(resource, req.params[idParam], req.params.tagId)
      .then((row) => res.status(200).json(row))
      .catch((err) => fail(res, err)),

  listByTag: (req, res) =>
    tagService
      .listResourcesByTag(resource, req.query.tag)
      .then((rows) => res.status(200).json(rows))
      .catch((err) => fail(res, err)),
});
