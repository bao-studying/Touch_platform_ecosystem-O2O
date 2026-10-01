const express = require("express");
const router = express.Router();
const { protectTenant } = require("../middleware/tenantAuth");
const { createOrder, getMyOrders, getMyOrder, renewPayment, simulatePayment } = require("../controllers/orderController");

router.post("/", protectTenant, createOrder);
router.get("/mine", protectTenant, getMyOrders);
router.get("/:id", protectTenant, getMyOrder);
router.post("/:id/renew-payment", protectTenant, renewPayment);
router.post("/:id/simulate-payment", protectTenant, simulatePayment);

module.exports = router;
