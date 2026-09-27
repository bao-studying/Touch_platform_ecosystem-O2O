const axios = require("axios");

// Client gọi SANG Admin Server (nơi Super Admin quản lý giá gói/sản phẩm) — dùng để backend của
// Client Server luôn tính đúng số tiền THẬT khi tạo đơn thanh toán, thay vì đọc giá tĩnh viết chết
// trong code như trước. Đây là hướng gọi HTTP server-to-server (khác với Socket.IO ở frontend chỉ
// dùng để cập nhật giao diện real-time).
//
// An toàn khi Admin Server gặp sự cố: timeout ngắn (4s) + trả về null thay vì throw, để nơi gọi có
// thể tự quyết fallback về giá dự phòng cục bộ (xem config/planPricing.js) — KHÔNG để một server phụ
// bị lỗi làm sập hẳn luồng thanh toán của khách.
const ADMIN_SERVER_URL = process.env.ADMIN_SERVER_URL || "http://localhost:5001";

const adminServerClient = axios.create({
  baseURL: `${ADMIN_SERVER_URL}/api`,
  timeout: 4000,
});

// @returns {Object|null} map { [planKey]: priceVnd } lấy từ Admin Server, hoặc null nếu gọi thất bại
async function fetchLivePlanPrices() {
  try {
    const res = await adminServerClient.get("/public/plans");
    const priceByPlan = {};
    for (const p of res.data || []) {
      if (p.planKey) priceByPlan[p.planKey] = p.priceVnd;
    }
    return priceByPlan;
  } catch (err) {
    console.warn(
      "[adminServerClient] Không lấy được giá gói từ Admin Server (dùng giá dự phòng cục bộ):",
      err.message
    );
    return null;
  }
}

module.exports = { fetchLivePlanPrices, adminServerClient };
