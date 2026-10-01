const express = require("express");
const router = express.Router();
const {
  registerTenant,
  loginTenant,
  getTenantMe,
  verifyTenantEmail,
  resendTenantVerification,
  changeTenantPassword,
} = require("../controllers/tenantAuthController");
const { protectTenant } = require("../middleware/tenantAuth");

// Đăng ký/đăng nhập Tenant ngay tại Admin Server — dùng cho trang giới thiệu (Register/Login) và Store
// (yêu cầu đăng nhập mới đặt hàng được). Token sinh ra dùng chung được cho Client Server (xem tenantAuth.js).
router.post("/register", registerTenant);
router.post("/login", loginTenant);
router.get("/me", protectTenant, getTenantMe);
router.get("/verify-email/:token", verifyTenantEmail);
router.post("/resend-verification", protectTenant, resendTenantVerification);
router.put("/password", protectTenant, changeTenantPassword);

module.exports = router;
