const jwt = require("jsonwebtoken");

// Ký bằng JWT_SECRET CHUNG với Client Server — token tạo ở Admin Server (đăng ký/đăng nhập trên trang giới
// thiệu, hoặc "Login as User" của Super Admin) dùng thẳng được cho Client Server mà không cần thêm bước nào.
const generateTenantToken = (id, extraClaims = {}) => {
  return jwt.sign({ id, ...extraClaims }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = generateTenantToken;
