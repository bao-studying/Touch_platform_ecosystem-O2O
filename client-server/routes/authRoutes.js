const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin, getMe, updateProfile, updatePassword } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);
router.put("/me/password", protect, updatePassword);

module.exports = router;
