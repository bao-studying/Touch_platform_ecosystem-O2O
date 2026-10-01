const axios = require("axios");
const jwt = require("jsonwebtoken");

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

// Chuyển tiếp 1 giao dịch SePay sang Admin Server — dùng cho đơn hàng vật phẩm decor mua ở Admin Web (mã O2OHW...).
// SePay chỉ có MỘT webhook (link ngrok/domain trỏ vào Client Server), nên Client Server nhận trước rồi chuyển tiếp.
// Xác thực server-to-server bằng JWT ngắn hạn (2 phút) ký bằng JWT_SECRET — 2 server vốn đã dùng CHUNG secret này
// nên không cần thêm cấu hình mới. Claim `purpose` đảm bảo token đăng nhập của khách không dùng được vào endpoint này.
// Trả về { ok, data } — KHÔNG throw, để webhook tự quyết trả gì cho SePay (ok=false → success:false → SePay sẽ gọi lại sau).
async function forwardSepayPayment(payload) {
  try {
    const token = jwt.sign({ purpose: "sepay-forward" }, process.env.JWT_SECRET, { expiresIn: "2m" });
    const res = await adminServerClient.post("/payments/internal/sepay", payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    return { ok: true, data: res.data };
  } catch (err) {
    console.error("[adminServerClient] Chuyển tiếp giao dịch SePay sang Admin Server thất bại:", err.response?.data?.message || err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { fetchLivePlanPrices, forwardSepayPayment, adminServerClient };
