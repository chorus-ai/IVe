const ORDERS = ["ASC", "DESC"];
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 1000;

/**
 * Helper: Parse pagination & sorting parameters
 */
function getPaginationAndSort(page, pageSize, sortOrder, sortField = "person_id") {
  const pageNum = parseInt(page, 10) || 1;
  const size = parseInt(pageSize, 10) || DEFAULT_PAGE_SIZE;

  // Only apply sorting if a valid order is provided
  const order = ORDERS.includes((sortOrder || "").toUpperCase())
    ? [[sortField, sortOrder]]
    : undefined;

  const limit = size > 0 && size <= MAX_PAGE_SIZE ? size : DEFAULT_PAGE_SIZE;
  const offset = (pageNum - 1) * limit;

  return { order, offset, limit };
}

module.exports = {
  getPaginationAndSort,
};