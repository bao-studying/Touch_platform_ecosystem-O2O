const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select("-password");
      if (!req.admin) {
        return res.status(401).json({ message: "Không tìm thấy tài khoản, vui lòng đăng nhập lại" });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  }

  return res.status(401).json({ message: "Không có quyền truy cập, thiếu token" });
};

module.exports = { protect };
