const express = require("express");
const router = express.Router();
const { protectTenant } = require("../middleware/tenantAuth");
const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getCart,
  saveCart,
} = require("../controllers/customerController");

// Khu vực tài khoản của khách trên trang giới thiệu: hồ sơ, sổ địa chỉ, giỏ hàng.
router.use(protectTenant);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.post("/addresses", addAddress);
router.put("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);

router.get("/cart", getCart);
router.put("/cart", saveCart);

module.exports = router;
