const express = require("express");
const router = express.Router();
const { createOrder, getOrderStatus, simulateSuccess, sepayWebhook, getBankInfo } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// Public — SePay gọi thẳng vào đây khi có giao dịch chuyển khoản khớp
router.post("/webhook/sepay", sepayWebhook);
// Public — Admin Server lấy tài khoản nhận tiền để dùng chung 1 mã QR (đặt TRƯỚC "/:id" kẻo bị bắt nhầm thành id)
router.get("/bank-info", getBankInfo);

// Admin
router.post("/", protect, createOrder);
router.get("/:id", protect, getOrderStatus);
router.post("/:id/simulate-success", protect, simulateSuccess);

module.exports = router;
