const express = require("express");
const router = express.Router();
const { listPublicPlans } = require("../controllers/planConfigController");
const { listPublicHardware } = require("../controllers/hardwareController");
const { getPublicCms } = require("../controllers/cmsController");
const { getPublicSupportInfo } = require("../controllers/settingsController");
const { getPaymentOptions } = require("../controllers/paymentController");

router.get("/plans", listPublicPlans);
router.get("/hardware", listPublicHardware);
router.get("/cms", getPublicCms);
router.get("/support-info", getPublicSupportInfo);
router.get("/payment-options", getPaymentOptions);

module.exports = router;
