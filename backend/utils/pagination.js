export const parsePagination = (query = {}, { defaultLimit = 50, maxLimit = 200 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const paginatedResponse = (items, { page, limit, total }) => ({
  items,
  page,
  limit,
  total,
  pages: Math.ceil(total / limit) || 1,
  hasMore: page * limit < total,
});

export default { parsePagination, paginatedResponse };
