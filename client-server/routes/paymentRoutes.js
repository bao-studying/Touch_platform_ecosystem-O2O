const express = require("express");
const router = express.Router();
const { createOrder, getOrderStatus, simulateSuccess, sepayWebhook } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// Public — SePay gọi thẳng vào đây khi có giao dịch chuyển khoản khớp
router.post("/webhook/sepay", sepayWebhook);

// Admin
router.post("/", protect, createOrder);
router.get("/:id", protect, getOrderStatus);
router.post("/:id/simulate-success", protect, simulateSuccess);

module.exports = router;
