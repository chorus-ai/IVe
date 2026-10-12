"use strict";

// Validates against the REAL request contract used by the app today
// (see client/src/apps/ive/api/omop.ts / components/ClinicalTablesDetail.tsx):
//   - filters are a flat, DB-column-keyed body (e.g. { gender_concept_id: [8507] }),
//     not wrapped in a `filter` object with API-friendly names
//   - page / pageSize / sortOrder / attrs / count / countOnly are query params, not body fields
//   - GET /<entity>?... (no filter body) and POST /<entity>/search (filter body) both apply

const db = require("../../../models");

// One entry per OMOP entity with caching/validation enabled.
//   model: Sequelize model key (`db[model]`) — for OMOP entities this is
//     always the same as the route/entity name, kept explicit for clarity.
//   unboundedRequiresFilter: filter keys that, when present, scope the result
//     set narrowly enough (e.g. to one patient) that pageSize=0/"all" is safe
//     to allow — several real widgets need "all of this patient's records"
//     (timeline, measurement trend, top concepts). Still capped at
//     UNBOUNDED_SAFETY_CEILING, never truly unlimited SQL. Unscoped
//     unbounded requests (no person_id) are rejected outright.
const ENTITY_CONFIG = {
  person: {
    model: "person",
    unboundedRequiresFilter: ["person_id"],
  },
  // Entities with a person_id column support the same "all of this
  // patient's records" unbounded exception real widgets rely on
  // (cohort-timeline, person-measurements, person-top-concepts,
  // measurement-trend, patient-profile).
  condition_occurrence: { model: "condition_occurrence", unboundedRequiresFilter: ["person_id"] },
  death: { model: "death", unboundedRequiresFilter: ["person_id"] },
  device_exposure: { model: "device_exposure", unboundedRequiresFilter: ["person_id"] },
  drug_exposure: { model: "drug_exposure", unboundedRequiresFilter: ["person_id"] },
  measurement: { model: "measurement", unboundedRequiresFilter: ["person_id"] },
  note: { model: "note", unboundedRequiresFilter: ["person_id"] },
  observation: { model: "observation", unboundedRequiresFilter: ["person_id"] },
  observation_period: { model: "observation_period", unboundedRequiresFilter: ["person_id"] },
  procedure_occurrence: { model: "procedure_occurrence", unboundedRequiresFilter: ["person_id"] },
  visit_detail: { model: "visit_detail", unboundedRequiresFilter: ["person_id"] },
  visit_occurrence: { model: "visit_occurrence", unboundedRequiresFilter: ["person_id"] },
  // No person_id column — no unbounded exception; pageSize=0/"all" is
  // always rejected for these (matches today's real caller usage).
  cohort: { model: "cohort" },
  cohort_definition: { model: "cohort_definition" },
  note_nlp: { model: "note_nlp" },
};

// Even a person_id-scoped "unbounded" request gets a real SQL LIMIT — a
// runaway record count shouldn't turn into an unlimited `SELECT *`. Must stay
// <= _helper.js's MAX_PAGE_SIZE or it gets silently clamped back down there.
const UNBOUNDED_SAFETY_CEILING = 5000;

// Default cap on an explicit (non-unbounded) pageSize.
const MAX_PAGE_SIZE = 200;

// How long a cached search/browse result lives in Redis.
const CACHE_TTL_SECONDS = 3600;

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

class UnknownEntityError extends ValidationError {
  constructor(entity) {
    super(`No search validator registered for entity: ${entity}`);
  }
}

function getConfig(entity) {
  const config = ENTITY_CONFIG[entity];
  if (!config || !db[config.model]) throw new UnknownEntityError(entity);
  return config;
}

function getModel(entity) {
  return db[getConfig(entity).model];
}

// Filter body: any object is accepted, but every key must be a real column
// on the entity's table — this is the actual validation gap the plan set out
// to close (previously `req.body` reached `buildWhereClause` unchecked).
function validateFilterBody(entity, body) {
  const model = getModel(entity);
  if (body === undefined || body === null || (typeof body === "object" && Object.keys(body).length === 0)) {
    return {};
  }
  if (typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be an object");
  }
  const columns = model.rawAttributes;
  for (const key of Object.keys(body)) {
    if (!columns.hasOwnProperty(key)) {
      throw new ValidationError(`Unsupported filter field for ${entity}: ${key}`);
    }
  }
  return body;
}

// Query params: page / pageSize / sortOrder, same semantics as
// `_helper.js`'s getPaginationAndSort, plus a hard cap on pageSize.
// `filter` (the already-validated body from validateFilterBody) decides
// whether an unbounded pageSize is allowed. Returns the params to actually
// use downstream — pageSize=0/"all" never passes through as-is; it's either
// rejected or translated to UNBOUNDED_SAFETY_CEILING.
function validateQuery(entity, query, filter) {
  const config = getConfig(entity);

  const { page, sortOrder } = query || {};
  const pageSize = (query || {}).pageSize;

  if (page !== undefined && (!/^\d+$/.test(String(page)) || parseInt(page, 10) < 1)) {
    throw new ValidationError("page must be a positive integer");
  }

  if (sortOrder !== undefined && !["ASC", "DESC"].includes(String(sortOrder).toUpperCase())) {
    throw new ValidationError('sortOrder must be "ASC" or "DESC"');
  }

  const isUnlimited = pageSize === "all" || pageSize === "0" || pageSize === 0;

  if (!isUnlimited) {
    if (pageSize !== undefined) {
      if (!/^\d+$/.test(String(pageSize)) || parseInt(pageSize, 10) <= 0) {
        throw new ValidationError('pageSize must be a positive integer, 0, or "all"');
      }
      if (parseInt(pageSize, 10) > MAX_PAGE_SIZE) {
        throw new ValidationError(`pageSize exceeds maximum of ${MAX_PAGE_SIZE}`);
      }
    }
    return { page, pageSize, sortOrder };
  }

  // Scoping only counts as safe when it narrows to a SINGLE value (e.g. one
  // patient) — a multi-value array (person_id: [1,2,...,500]) can still cover
  // more records than the safety ceiling holds, silently truncating instead
  // of actually returning "everything", so it doesn't qualify for the exception.
  const requiredKeys = config.unboundedRequiresFilter || [];
  const presentKey = requiredKeys.find((key) => filter && filter[key] !== undefined);
  const isSingleValue = presentKey && (!Array.isArray(filter[presentKey]) || filter[presentKey].length === 1);

  if (!isSingleValue) {
    if (presentKey) {
      throw new ValidationError(
        `pageSize=0/"all" requires a single ${presentKey} value for ${entity} (got multiple)`,
      );
    }
    throw new ValidationError(
      `pageSize=0/"all" requires one of [${requiredKeys.join(", ")}] in the filter for ${entity}`,
    );
  }

  return { page, pageSize: UNBOUNDED_SAFETY_CEILING, sortOrder };
}

module.exports = {
  validateFilterBody,
  validateQuery,
  ValidationError,
  UnknownEntityError,
  ENTITY_CONFIG,
  UNBOUNDED_SAFETY_CEILING,
  MAX_PAGE_SIZE,
  CACHE_TTL_SECONDS,
};
