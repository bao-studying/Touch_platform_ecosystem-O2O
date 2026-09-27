const jwt = require("jsonwebtoken");

const generateSuperAdminToken = (id) => {
  return jwt.sign({ id, role: "superadmin" }, process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET, {
    expiresIn: "7d", // ngắn hơn token Tenant (30d) vì đây là khu vực nhạy cảm hơn
  });
};

module.exports = generateSuperAdminToken;
