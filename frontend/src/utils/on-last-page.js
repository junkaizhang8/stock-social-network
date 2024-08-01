const onLastPage = (page, limit, total) => {
  return total - (page + 1) * limit <= 0;
};

export default onLastPage;
