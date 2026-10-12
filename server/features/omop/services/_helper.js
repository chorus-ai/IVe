const ORDERS = ["ASC", "DESC"];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 5000; // must stay >= omop-search-validator.js's UNBOUNDED_SAFETY_CEILING
const { Op } = require("sequelize");
const db = require("../../../models");

/**
 * Helper: Parse pagination & sorting parameters.
 */
function getPaginationAndSort(page, pageSize, sortOrder, sortField = "person_id") {
  const order = ORDERS.includes((sortOrder || "").toUpperCase())
    ? [[sortField, sortOrder]]
    : undefined;

  // pageSize=0 (or "all") → no LIMIT/OFFSET (return full result set)
  const noLimit = pageSize === "all" || parseInt(pageSize, 10) === 0;
  if (noLimit) return { order, offset: undefined, limit: undefined };

  const pageNum = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || DEFAULT_PAGE_SIZE;
  const limit = size > 0 && size <= MAX_PAGE_SIZE ? size : DEFAULT_PAGE_SIZE;
  const offset = (pageNum - 1) * limit;

  return { order, offset, limit };
}

/**
 * Build a filter for ID fields.
 *
 * - If input is a single value → returns it directly (equality).
 * - If input is an array with one element → returns that element (treated as equality).
 * - If input is an array with multiple elements → returns an IN filter.
 * 
 */
function buildIdFilter(input) {
  if (Array.isArray(input)) {
    if (input.length === 1) {
      return input[0];
    }
    return { [Op.in]: input }; // multiple values → IN
  }
  return input;
}

/**
 * Build a filter for text fields.
 * Supports an object with keys: { contains, startsWith, endsWith, eq },
 * or a direct string (defaults to "contains" match).
 */
function buildTextFilter(input) {
  if (typeof input === "string") {
    return { [Op.like]: `%${input.trim()}%` };
  }
  if (typeof input === "object" && input !== null) {
    if (input.contains) {
      return { [Op.like]: `%${input.contains}%` };
    }
    if (input.startsWith) {
      return { [Op.like]: `${input.startsWith}%` };
    }
    if (input.endsWith) {
      return { [Op.like]: `%${input.endsWith}` };
    }
    if (input.eq) {
      return { [Op.eq]: input.eq };
    }
  }
  return undefined;
}

/**
 * Build a filter for numeric fields.
 * Supports an object with keys: { gt, lt, eq, between }
 * or a single number (equality).
 */
function buildNumericFilter(input) {
  if (typeof input === "number") {
    return { [Op.eq]: input };
  }
  if (typeof input === "object" && input !== null) {
    const filter = {};
    if (input.gt !== undefined) {
      filter[Op.gt] = input.gt;
    }
    if (input.lt !== undefined) {
      filter[Op.lt] = input.lt;
    }
    if (input.eq !== undefined) {
      filter[Op.eq] = input.eq;
    }
    if (Array.isArray(input.between) && input.between.length === 2) {
      filter[Op.between] = input.between;
    }
    const hasKeys =
      Object.keys(filter).length > 0 ||
      Object.getOwnPropertySymbols(filter).length > 0;
    return hasKeys ? filter : undefined;
  }
  return undefined;
}

/**
 * Build a filter for date fields.
 * Supports an object with keys: { gt, lt, eq, between }
 * or a single date string (equality).
 */
function buildDateFilter(input) {
  if (typeof input === "string") {
    return { [Op.eq]: input };
  }
  if (typeof input === "object" && input !== null) {
    const filter = {};
    if (input.gt) {
      filter[Op.gt] = input.gt;
    }
    if (input.lt) {
      filter[Op.lt] = input.lt;
    }
    if (input.eq) {
      filter[Op.eq] = input.eq;
    }
    if (Array.isArray(input.between) && input.between.length === 2) {
      filter[Op.between] = input.between;
    }
    const hasKeys =
      Object.keys(filter).length > 0 ||
      Object.getOwnPropertySymbols(filter).length > 0;
    return hasKeys ? filter : undefined;
  }
  return undefined;
}

/**
 * Build a "where clause" filter based on search parameters.
 * Iterates over provided keys and applies appropriate filters.
 */
function buildWhereClause(searchParams) {
  const whereClause = {};
  console.log("[buildWhereClause] input:", JSON.stringify(searchParams));

  for (const key in searchParams) {
    if (!searchParams.hasOwnProperty(key)) continue;
    const value = searchParams[key];
    if (value === undefined || value === null || value === "") continue;

    // Date and datetime fields
    if (key.endsWith("_date") || key.endsWith("_datetime")) {
      const filter = buildDateFilter(value);
      if (filter) {
        whereClause[key] = filter;
      }
    }
    // Text fields (with numeric fallback for e.g. measurement_time: 12)
    else if (key.endsWith("_time") || key.endsWith("_source_value")) {
      const filter = buildTextFilter(value);
      if (filter) {
        whereClause[key] = filter;
      } else {
        whereClause[key] = value;
      }
    }
    // ID fields
    else if (key.endsWith("_id")) {
      const filter = buildIdFilter(value);
      if (filter !== undefined) {
        whereClause[key] = filter;
      }
    }
    // Numeric fields (if the value is a number or numeric string)
    else if (typeof value === "number" || !isNaN(Number(value))) {
      const filter = buildNumericFilter(value);
      if (filter) {
        whereClause[key] = filter;
      }
    }
    // Otherwise, treat as a text filter
    else {
      const filter = buildTextFilter(value);
      if (filter) {
        whereClause[key] = filter;
      }
    }
  }
  console.log("[buildWhereClause] output:", require("util").inspect(whereClause, { depth: 5 }));
  return whereClause;
}

function getAttributes(attrs , table) {
  //validate coliumns in attrs with table columns
  const columns = db[table].rawAttributes;
  if (!attrs || attrs === "*" || attrs.toLowerCase?.() === "all") return undefined;
  if (typeof attrs === "string") {
    const list = attrs.split(",").map(s => s.trim()).filter(Boolean);
    const validList = list.filter(col => columns.hasOwnProperty(col));
    return validList.length ? validList : undefined;
  }
  if (Array.isArray(attrs)) {
    const validList = attrs.map(String).filter(col => columns.hasOwnProperty(col));
    return validList.length ? validList : undefined;
  }
  return undefined;
}

/**
 * Convert a Sequelize result array into { header, rows }.
 * When rows is empty, header is derived from the model's rawAttributes.
 *
 * `attrs`, if given, is the already-validated column list (getAttributes()'s
 * output — the same list used to build the Sequelize `attributes` clause) —
 * narrows the header to just those columns instead of always listing every
 * column on the table. Without it, a request that asked for e.g.
 * `attrs=person_id,gender_concept_id` still got back all 18 person columns,
 * 16 of them null-padded — attrs never actually shrank the response.
 */
function toTabular(rows, modelName, attrs) {
  const schemaHeader = modelName ? Object.keys(db[modelName].rawAttributes) : null;
  const requestedHeader =
    attrs && attrs.length && schemaHeader ? schemaHeader.filter((col) => attrs.includes(col)) : schemaHeader;

  if (!rows || rows.length === 0) {
    return { header: requestedHeader || [], rows: [] };
  }
  const plain = rows.map((r) => (r && r.get ? r.get({ plain: true }) : r));
  // Use the (possibly attrs-narrowed) model schema as the canonical header so
  // columns whose values failed type-parsing (and were dropped from
  // dataValues) still appear, and every row aligns to the same column order.
  const header = requestedHeader || Object.keys(plain[0]);
  return {
    header,
    rows: plain.map((r) => header.map((k) => (k in r ? r[k] : null))),
  };
}

/**
 * Shared handler for list endpoints supporting three response modes:
 *   default        → { header, rows }
 *   ?count=true    → { header, rows, count }
 *   ?countOnly=true → { count }
 */
async function respondWithMode(res, req, modelName, fetchRows, fetchCount) {
  const countOnly = req.query.countOnly === "true";
  const includeCount = req.query.count === "true";
  try {
    if (countOnly) {
      const count = await fetchCount();
      return res.status(200).json({ count });
    }
    const rows = await fetchRows();
    const tabular = toTabular(rows, modelName, getAttributes(req.query.attrs, modelName));
    if (includeCount) {
      const count = await fetchCount();
      return res.status(200).json({ ...tabular, count });
    }
    return res.status(200).json(tabular);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getAttributes,
  getPaginationAndSort,
  buildIdFilter,
  buildTextFilter,
  buildNumericFilter,
  buildDateFilter,
  buildWhereClause,
  toTabular,
  respondWithMode,
};
