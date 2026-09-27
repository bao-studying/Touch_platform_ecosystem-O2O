const express = require("express");
const router = express.Router();
const { protectTenant } = require("../middleware/tenantAuth");
const { createTicket, getMyTickets, replyAsTenant } = require("../controllers/ticketController");

router.post("/", protectTenant, createTicket);
router.get("/mine", protectTenant, getMyTickets);
router.post("/:id/reply", protectTenant, replyAsTenant);

module.exports = router;
