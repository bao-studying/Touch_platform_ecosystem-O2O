const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protectSuperAdmin } = require("../middleware/superAdminAuth");

const { loginSuperAdmin, getSuperAdminMe } = require("../controllers/superAdminAuthController");
const {
  getOverview,
  listTenants,
  getTenantDetail,
  toggleLockTenant,
  resetTenantPassword,
  loginAsTenant,
} = require("../controllers/superAdminController");
const { listAllPlans, updatePlan } = require("../controllers/planConfigController");
const { listAllHardware, createHardware, updateHardware, deleteHardware } = require("../controllers/hardwareController");
const { listAllOrders, updateOrderStatus, confirmManualPayment } = require("../controllers/orderController");
const { listAllTickets, replyAsSuperAdmin, updateTicketStatus } = require("../controllers/ticketController");
const { getAllCmsForAdmin, upsertCmsSection } = require("../controllers/cmsController");
const { getSettings, updateSettings, updateSuperAdminCredentials } = require("../controllers/settingsController");
const { superAdminNotifications: notif } = require("../controllers/notificationController");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { message: "Bạn đã thử quá nhiều lần, vui lòng thử lại sau ít phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/auth/login", loginLimiter, loginSuperAdmin);
router.get("/auth/me", protectSuperAdmin, getSuperAdminMe);

router.use(protectSuperAdmin);

router.get("/overview", getOverview);

router.get("/tenants", listTenants);
router.get("/tenants/:id", getTenantDetail);
router.put("/tenants/:id/lock", toggleLockTenant);
router.put("/tenants/:id/reset-password", resetTenantPassword);
router.post("/tenants/:id/login-as", loginAsTenant);

router.get("/plans", listAllPlans);
router.put("/plans/:id", updatePlan);

router.get("/hardware", listAllHardware);
router.post("/hardware", createHardware);
router.put("/hardware/:id", updateHardware);
router.delete("/hardware/:id", deleteHardware);

router.get("/notifications", notif.list);
router.put("/notifications/read-all", notif.markAllRead);
router.put("/notifications/:id/read", notif.markRead);

router.get("/orders", listAllOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.put("/orders/:id/confirm-payment", confirmManualPayment);

router.get("/tickets", listAllTickets);
router.post("/tickets/:id/reply", replyAsSuperAdmin);
router.put("/tickets/:id/status", updateTicketStatus);

router.get("/cms", getAllCmsForAdmin);
router.put("/cms/:section", upsertCmsSection);

router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.put("/settings/credentials", updateSuperAdminCredentials);

module.exports = router;
