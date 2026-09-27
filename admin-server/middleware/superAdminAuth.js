const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/SuperAdmin");

// Middleware riêng biệt hoàn toàn với protect (tenant) ở auth.js — dùng JWT_SECRET riêng (SUPER_ADMIN_JWT_SECRET)
// để token của Tenant và token của Super Admin không thể hoán đổi/giả mạo lẫn nhau.
const protectSuperAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET);
      if (decoded.role !== "superadmin") {
        return res.status(403).json({ message: "Không có quyền truy cập khu vực Super Admin" });
      }
      req.superAdmin = await SuperAdmin.findById(decoded.id).select("-password");
      if (!req.superAdmin) {
        return res.status(401).json({ message: "Không tìm thấy tài khoản Super Admin" });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  }

  return res.status(401).json({ message: "Không có quyền truy cập, thiếu token" });
};

module.exports = { protectSuperAdmin };
