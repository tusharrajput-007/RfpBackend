const { User, VendorDetail } = require("../models/index");
const { getPagination, getPagingData } = require("../utils/pagination");
const asyncWrapper = require("../utils/asyncWrapper");
const AppError = require("../utils/AppError");

// get all vendors
const getVendors = asyncWrapper(async (req, res) => {
  const { page, limit } = req.query;
  const { limit: parsedLimit, offset } = getPagination(page, limit);

  const data = await User.findAndCountAll({
    where: { user_type: "vendor" },
    attributes: ["id", "firstname", "lastname", "email", "mobile"],
    include: [
      {
        model: VendorDetail,
        attributes: ["no_of_employees", "status"],
      },
    ],
    limit: parsedLimit,
    offset,
  });

  const vendors = data.rows.map((row) => ({
    user_id: row.id,
    name: row.firstname + " " + row.lastname,
    email: row.email,
    mobile: row.mobile,
    no_of_employees: row.VendorDetail.no_of_employees,
    status: row.VendorDetail.status,
  }));

  const response = getPagingData(
    { count: data.count, rows: vendors },
    page,
    parsedLimit,
  );

  return res.status(200).json({
    response: "success",
    message: "Vendors fetched successfully",
    ...response,
  });
});

module.exports = { getVendors };
