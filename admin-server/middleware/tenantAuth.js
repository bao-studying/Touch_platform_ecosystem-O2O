const jwt = require("jsonwebtoken");
const Admin = require("../models/shared/SharedAdmin");

// Xác thực Tenant (chủ doanh nghiệp) ngay TẠI Admin Server — dùng CHUNG JWT_SECRET với Client Server,
// nên token đăng nhập ở đâu cũng dùng lại được ở kia (không cần đăng nhập 2 lần).
const protectTenant = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select("-password");
      if (!req.admin) return res.status(401).json({ message: "Không tìm thấy tài khoản, vui lòng đăng nhập lại" });
      if (req.admin.isLocked) return res.status(403).json({ message: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ." });
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  }
  return res.status(401).json({ message: "Không có quyền truy cập, thiếu token" });
};

module.exports = { protectTenant };
