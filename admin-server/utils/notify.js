const Notification = require("../models/Notification");
const { emitToTenant, emitToSuperAdmins } = require("../sockets");

// Rút gọn 1 thông báo thành object gửi cho giao diện. `read` tính theo người đang xem.
const serialize = (n, readerId) => ({
  _id: n._id,
  type: n.type,
  title: n.title,
  body: n.body,
  link: n.link,
  createdAt: n.createdAt,
  read: readerId ? n.readBy.some((id) => String(id) === String(readerId)) : false,
});

// Thông báo là tính năng phụ — KHÔNG BAO GIỜ được làm hỏng luồng chính (đặt hàng, webhook thanh toán...).
// Vì vậy mọi lỗi ở đây chỉ ghi log rồi bỏ qua.
async function notifyTenant(tenantId, { type = "system", title, body = "", link = "" }) {
  try {
    const n = await Notification.create({ audience: "tenant", tenant: tenantId, type, title, body, link });
    emitToTenant(String(tenantId), "notification:new", serialize(n));
    return n;
  } catch (err) {
    console.error("[notify] tenant:", err.message);
  }
}

async function notifySuperAdmins({ type = "system", title, body = "", link = "" }) {
  try {
    const n = await Notification.create({ audience: "superadmin", type, title, body, link });
    emitToSuperAdmins("notification:new", serialize(n));
    return n;
  } catch (err) {
    console.error("[notify] superadmin:", err.message);
  }
}

module.exports = { notifyTenant, notifySuperAdmins, serialize };
