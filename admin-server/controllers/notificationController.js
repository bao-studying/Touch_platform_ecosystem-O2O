const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const { serialize } = require("../utils/notify");

// Dùng chung cho 2 nhóm người nhận. `scope(req)` trả về { readerId, filter } của người đang gọi API,
// nên khách CHỈ đọc được thông báo của chính mình, Super Admin chỉ thấy thông báo nhóm "superadmin".
const makeHandlers = (scope) => ({
  // GET ?limit=30 → { items, unreadCount }
  list: async (req, res) => {
    const { readerId, filter } = scope(req);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ ...filter, readBy: { $ne: readerId } }),
    ]);
    res.json({ items: items.map((n) => serialize(n, readerId)), unreadCount });
  },

  // PUT /:id/read
  markRead: async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Mã thông báo không hợp lệ" });
    const { readerId, filter } = scope(req);
    await Notification.updateOne({ _id: req.params.id, ...filter }, { $addToSet: { readBy: readerId } });
    res.json({ ok: true });
  },

  // PUT /read-all
  markAllRead: async (req, res) => {
    const { readerId, filter } = scope(req);
    await Notification.updateMany({ ...filter, readBy: { $ne: readerId } }, { $addToSet: { readBy: readerId } });
    res.json({ ok: true });
  },
});

const tenantNotifications = makeHandlers((req) => ({
  readerId: req.admin._id,
  filter: { audience: "tenant", tenant: req.admin._id },
}));

const superAdminNotifications = makeHandlers((req) => ({
  readerId: req.superAdmin._id,
  filter: { audience: "superadmin" },
}));

module.exports = { tenantNotifications, superAdminNotifications };
