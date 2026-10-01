// Tiện ích dùng chung cho địa chỉ giao hàng (sổ địa chỉ + đơn hàng).

// Chấp nhận số VN dạng 0xxxxxxxxx / +84xxxxxxxxx (có thể có dấu cách, chấm, gạch).
const normalizePhone = (raw) => String(raw || "").replace(/[\s.\-()]/g, "");
const isValidPhone = (raw) => /^(\+?84|0)\d{9,10}$/.test(normalizePhone(raw));

// Chỉ lấy các field được phép, cắt khoảng trắng — tránh nhét field lạ vào DB.
const pickAddress = (body = {}) => ({
  label: String(body.label || "").trim().slice(0, 30),
  fullName: String(body.fullName || "").trim().slice(0, 80),
  phone: normalizePhone(body.phone),
  province: String(body.province || "").trim().slice(0, 80),
  district: String(body.district || "").trim().slice(0, 80),
  ward: String(body.ward || "").trim().slice(0, 80),
  line: String(body.line || "").trim().slice(0, 200),
});

// Trả về thông báo lỗi (tiếng Việt) hoặc null nếu hợp lệ.
const validateAddress = (a) => {
  if (!a.fullName) return "Vui lòng nhập họ tên người nhận";
  if (!isValidPhone(a.phone)) return "Số điện thoại không hợp lệ (ví dụ: 0901234567)";
  if (!a.line) return "Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)";
  if (!a.province) return "Vui lòng nhập tỉnh/thành phố";
  return null;
};

// Chuỗi địa chỉ hiển thị 1 dòng — Super Admin đọc trong trang Đơn hàng (field shippingAddress có sẵn).
const formatAddress = (a) =>
  [a.line, a.ward, a.district, a.province].filter(Boolean).join(", ");

module.exports = { normalizePhone, isValidPhone, pickAddress, validateAddress, formatAddress };
