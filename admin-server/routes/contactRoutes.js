const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { submitContact } = require("../controllers/contactController");

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { message: "Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, submitContact);

module.exports = router;
