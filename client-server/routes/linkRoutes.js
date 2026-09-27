const express = require("express");
const router = express.Router();
const { getLinksByBusiness, createLink, updateLink, deleteLink } = require("../controllers/linkController");
const { protect } = require("../middleware/auth");

router.get("/business/:businessId", protect, getLinksByBusiness);
router.post("/", protect, createLink);
router.put("/:id", protect, updateLink);
router.delete("/:id", protect, deleteLink);

module.exports = router;
