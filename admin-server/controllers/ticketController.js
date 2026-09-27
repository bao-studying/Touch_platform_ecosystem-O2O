const Ticket = require("../models/Ticket");
const Business = require("../models/shared/SharedBusiness");
const { emitToTenant } = require("../sockets");

// ============ PHÍA TENANT ============
// @route POST /api/tickets
const createTicket = async (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ message: "Vui lòng nhập tiêu đề và nội dung" });
  const business = await Business.findOne({ owner: req.admin._id });
  const ticket = await Ticket.create({
    tenant: req.admin._id,
    business: business?._id,
    subject,
    messages: [{ from: "tenant", senderName: req.admin.name, message }],
  });
  res.status(201).json(ticket);
};

// @route GET /api/tickets/mine
const getMyTickets = async (req, res) => {
  const tickets = await Ticket.find({ tenant: req.admin._id }).sort({ updatedAt: -1 });
  res.json(tickets);
};

// @route POST /api/tickets/:id/reply
const replyAsTenant = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Không tìm thấy ticket" });
  if (ticket.tenant.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Bạn không có quyền truy cập ticket này" });
  }
  ticket.messages.push({ from: "tenant", senderName: req.admin.name, message: req.body.message });
  if (ticket.status === "resolved") ticket.status = "open";
  await ticket.save();
  res.json(ticket);
};

// ============ PHÍA SUPER ADMIN ============
// @route GET /api/super-admin/tickets
const listAllTickets = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const tickets = await Ticket.find(filter).populate("tenant", "name email").sort({ updatedAt: -1 });
  res.json(tickets);
};

// @route POST /api/super-admin/tickets/:id/reply
const replyAsSuperAdmin = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Không tìm thấy ticket" });
  ticket.messages.push({ from: "superadmin", senderName: req.superAdmin.name, message: req.body.message });
  if (req.body.status) ticket.status = req.body.status;
  else if (ticket.status === "open") ticket.status = "in_progress";
  await ticket.save();
  emitToTenant(ticket.tenant.toString(), "ticket:reply", { ticketId: ticket._id });
  res.json(ticket);
};

// @route PUT /api/super-admin/tickets/:id/status
const updateTicketStatus = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Không tìm thấy ticket" });
  ticket.status = req.body.status;
  await ticket.save();
  res.json(ticket);
};

module.exports = { createTicket, getMyTickets, replyAsTenant, listAllTickets, replyAsSuperAdmin, updateTicketStatus };
