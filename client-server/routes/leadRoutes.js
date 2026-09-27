const express = require("express");
const router = express.Router();
const { submitLead, getLeadsByBusiness, exportLeadsCsv } = require("../controllers/leadController");
const { protect } = require("../middleware/auth");

// Public — khách đăng ký loyalty
router.post("/public", submitLead);

// Admin — CRM
router.get("/business/:businessId", protect, getLeadsByBusiness);
router.get("/business/:businessId/export", protect, exportLeadsCsv);

module.exports = router;
