const express = require("express");
const router = express.Router();
const { getTagsByBusiness, registerTag, activateTag, updatePlacementNote, recordScan } = require("../controllers/nfcController");
const { protect } = require("../middleware/auth");

// Public — ghi nhận lượt quét thật
router.post("/scan/:uid", recordScan);

// Admin — Guided Activation Workflow
router.get("/business/:businessId", protect, getTagsByBusiness);
router.post("/", protect, registerTag);
router.put("/:id/activate", protect, activateTag);
router.put("/:id/note", protect, updatePlacementNote);

module.exports = router;
