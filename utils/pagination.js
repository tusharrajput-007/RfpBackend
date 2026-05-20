const getPagination = (page, limit) => {
  const parsedLimit = parseInt(limit) || 10;
  const parsedPage = parseInt(page) || 1;
  const offset = (parsedPage - 1) * parsedLimit;
  return { limit: parsedLimit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count, rows } = data;
  const totalPages = Math.ceil(count / limit);
  return {
    total: count,
    data: rows,
    page: parseInt(page) || 1,
    totalPages,
  };
};

module.exports = { getPagination, getPagingData };
