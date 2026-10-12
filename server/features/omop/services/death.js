const db = require("../../../models");
const { Op } = require("sequelize");
const {
  getAttributes,
  getPaginationAndSort,
  buildTextFilter,
} = require("./_helper");

const MODEL = "death";
const PK = "person_id";

const isNumeric = (v) => typeof v === "number" || /^-?\d+$/.test(String(v));
const isIdColumn = (col) => col.endsWith("_id") || col.endsWith("_concept_id");

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
  const where = {};
  for (const rawKey of Object.keys(searchParams)) {
    const val = searchParams[rawKey];
    if (val === undefined || val === null || val === "") continue;
    if (rawKey.endsWith("_min") || rawKey.endsWith("_max")) {
      const base = rawKey.replace(/_(min|max)$/, "");
      where[base] = where[base] || {};
      if (rawKey.endsWith("_min")) where[base][Op.gte] = val;
      else where[base][Op.lte] = val;
      continue;
    }
    if (isIdColumn(rawKey)) {
      const arr = String(val)
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((x) => (isNumeric(x) ? Number(x) : x));
      if (arr.length) where[rawKey] = { [Op.in]: arr };
      continue;
    }
    if (rawKey.endsWith("_datetime") || rawKey.endsWith("_date")) {
      where[rawKey] = val;
      continue;
    }
    if (typeof val === "string") {
      where[rawKey] = buildTextFilter(val);
      continue;
    }
    where[rawKey] = val;
  }
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
  const where = {};
  for (const rawKey of Object.keys(searchParams)) {
    const val = searchParams[rawKey];
    if (val === undefined || val === null || val === "") continue;
    if (rawKey.endsWith("_min") || rawKey.endsWith("_max")) {
      const base = rawKey.replace(/_(min|max)$/, "");
      where[base] = where[base] || {};
      if (rawKey.endsWith("_min")) where[base][Op.gte] = val;
      else where[base][Op.lte] = val;
      continue;
    }
    if (isIdColumn(rawKey)) {
      const arr = String(val)
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((x) => (isNumeric(x) ? Number(x) : x));
      if (arr.length) where[rawKey] = { [Op.in]: arr };
      continue;
    }
    if (typeof val === "string") {
      where[rawKey] = buildTextFilter(val);
      continue;
    }
    where[rawKey] = val;
  }
  return db[MODEL].count({ where });
};
