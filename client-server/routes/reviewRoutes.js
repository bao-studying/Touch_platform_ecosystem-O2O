const express = require("express");
const router = express.Router();
const { submitReview, submitPrivateFeedback, getReviewsByBusiness, updateReviewStatus } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

// Public — khách gửi đánh giá
router.post("/public", submitReview);
// Public — khách gửi "Góp ý riêng" thẳng cho chủ quán, không qua luồng chấm sao
router.post("/public/private", submitPrivateFeedback);

// Admin
router.get("/business/:businessId", protect, getReviewsByBusiness);
router.put("/:id/status", protect, updateReviewStatus);

module.exports = router;
