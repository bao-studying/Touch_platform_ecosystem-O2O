// Mã đơn ngắn hiển thị cho người dùng — khớp với hàm shortCode() ở Admin Web (#ABC123).
const shortCode = (id) => `#${String(id).slice(-6).toUpperCase()}`;
const fmtVnd = (n) => `${Number(n || 0).toLocaleString("vi-VN")}đ`;
const isPaid = (order) => order.paymentStatus === "paid" || order.paymentStatus === "manual_confirmed";

module.exports = { shortCode, fmtVnd, isPaid };
