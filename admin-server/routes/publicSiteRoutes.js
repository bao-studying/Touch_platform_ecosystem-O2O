const express = require("express");
const router = express.Router();
const { listPublicPlans } = require("../controllers/planConfigController");
const { listPublicHardware } = require("../controllers/hardwareController");
const { getPublicCms } = require("../controllers/cmsController");
const { getPublicSupportInfo } = require("../controllers/settingsController");

router.get("/plans", listPublicPlans);
router.get("/hardware", listPublicHardware);
router.get("/cms", getPublicCms);
router.get("/support-info", getPublicSupportInfo);

module.exports = router;
