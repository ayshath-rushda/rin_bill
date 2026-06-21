const paginate = async (Model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = '',
    select = '',
    lean = true,
  } = options;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Model.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .select(select)
      .lean(lean),
    Model.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export default paginate;
