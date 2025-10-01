const parseNumber = (value, defaultValue) => {
  if (typeof value === 'undefined') {
    return defaultValue;
  }
  const parsedValue = parseInt(value);
  if (Number.isNaN(parsedValue)) {
    return defaultValue;
  }
  return parsedValue;
};

export const parsePaginationParams = (query) => {
  const { page, perPage } = query;
  const parsePage = parseNumber(page, 1);
  const parsePerPage = parseNumber(perPage, 10);

  return {
    page: parsePage,
    perPage: parsePerPage,
  };
};
