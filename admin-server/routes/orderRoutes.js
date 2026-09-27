const express = require("express");
const router = express.Router();
const { protectTenant } = require("../middleware/tenantAuth");
const { createOrder, getMyOrders } = require("../controllers/orderController");

router.post("/", protectTenant, createOrder);
router.get("/mine", protectTenant, getMyOrders);

module.exports = router;
