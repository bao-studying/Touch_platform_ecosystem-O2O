const express = require("express");
const router = express.Router();
const { protectTenant } = require("../middleware/tenantAuth");
const { tenantNotifications: h } = require("../controllers/notificationController");

// Chuông thông báo của khách trên Admin Web.
router.use(protectTenant);
router.get("/", h.list);
router.put("/read-all", h.markAllRead);
router.put("/:id/read", h.markRead);

module.exports = router;
