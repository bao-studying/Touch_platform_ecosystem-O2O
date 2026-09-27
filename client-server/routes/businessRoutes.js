const express = require("express");
const router = express.Router();
const {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  changePlan,
  getPlanHistory,
  getPublicBusinessBySlug,
} = require("../controllers/businessController");
const { protect } = require("../middleware/auth");

// Public — không cần đăng nhập (Landing Page khách hàng)
router.get("/public/:slug", getPublicBusinessBySlug);

// Admin — cần đăng nhập
router.post("/", protect, createBusiness);
router.get("/mine", protect, getMyBusinesses);
router.get("/:id", protect, getBusinessById);
router.put("/:id", protect, updateBusiness);
router.put("/:id/plan", protect, changePlan);
router.get("/:id/history", protect, getPlanHistory);

module.exports = router;
