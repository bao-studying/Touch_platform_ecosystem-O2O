// Tiện ích validate/làm sạch input dùng chung — chặn payload quá dài (spam) và định dạng sai
// cho các endpoint PUBLIC (không qua middleware auth), nơi dễ bị lợi dụng nhất.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cắt chuỗi về đúng kiểu string, trim khoảng trắng, giới hạn độ dài tối đa.
// Trả về "" nếu input không phải string/number hợp lệ — tránh lỗi khi ai đó gửi object/array.
function capString(value, maxLen = 255) {
  if (value === undefined || value === null) return "";
  const str = typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
  return str.trim().slice(0, maxLen);
}

function isValidEmail(value) {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value.trim());
}

// Đảm bảo giá trị dùng làm ID Mongo là string thuần (chặn kiểu tấn công NoSQL injection
// dạng gửi object { "$ne": null } thay vì chuỗi ID để bỏ qua điều kiện query).
function isPlainIdString(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

module.exports = { capString, isValidEmail, isPlainIdString };
