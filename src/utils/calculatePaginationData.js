export const calculatePaginationData = (total, perPage, page) => {
  const totalPages = Math.ceil(total / perPage);
  const hasPreviousPage = page !== 1;
  const hasNextPage = Boolean(totalPages - page);

  return {
    page,
    perPage,
    totalItems: total,
    totalPages,
    hasPreviousPage,
    hasNextPage,
  };
};
