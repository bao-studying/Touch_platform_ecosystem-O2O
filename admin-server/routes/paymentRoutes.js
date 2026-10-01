const express = require("express");
const router = express.Router();
const { internalSepay } = require("../controllers/paymentController");

// SePay KHÔNG gọi thẳng vào Admin Server: webhook duy nhất của bạn trỏ vào Client Server (ngrok/domain), Client Server
// chuyển tiếp các giao dịch mã O2OHW... sang đây. Endpoint này được bảo vệ bằng JWT server-to-server (JWT_SECRET dùng chung).
router.post("/internal/sepay", internalSepay);

module.exports = router;
