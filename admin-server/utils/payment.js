const crypto = require("crypto");
const Order = require("../models/Order");

// ===== Thanh toán chuyển khoản SePay — DÙNG CHUNG tài khoản nhận tiền + mã QR với Client Web / Client Server =====
//
// Cách hoạt động (không cần cấu hình webhook thứ 2):
//   • SePay chỉ có 1 webhook: link ngrok/domain của bạn trỏ vào Client Server (POST /api/payments/webhook/sepay).
//   • Mã đơn vật phẩm decor ở Admin Web có dạng O2OHW + 8 ký tự → Client Server tự chuyển tiếp sang Admin Server
//     (POST /api/payments/internal/sepay, xác thực bằng JWT_SECRET dùng chung) — xem controllers/paymentController.js.
//   • Tài khoản nhận tiền (SEPAY_BANK_ID / SEPAY_ACCOUNT_NO / SEPAY_ACCOUNT_NAME) đọc từ .env của Client Server qua
//     GET {CLIENT_SERVER_URL}/api/payments/bank-info. Muốn ghi đè riêng cho Admin Server: đặt cùng 3 biến SEPAY_* ở .env này.

const PAYMENT_WINDOW_MS = 15 * 60 * 1000; // 15 phút — giống modal thanh toán nâng cấp gói bên Client Web
// Bảng chữ cái bỏ ký tự dễ nhầm (0/O, 1/I) vì khách có thể gõ tay nội dung chuyển khoản.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_PREFIX = "O2OHW"; // "HW" = hardware; không đụng mã nâng cấp gói (O2O + 6 ký tự HEX của mã DN + tên gói)

// Mã đơn dạng O2OHW + 8 ký tự ngẫu nhiên (vd O2OHWK7Q2M9XD) — đồng thời là nội dung chuyển khoản.
async function generatePaymentCode() {
  for (let i = 0; i < 8; i++) {
    let rand = "";
    for (let j = 0; j < 8; j++) rand += CODE_CHARS[crypto.randomInt(0, CODE_CHARS.length)];
    const code = `${CODE_PREFIX}${rand}`;
    if (!(await Order.exists({ paymentCode: code }))) return code;
  }
  throw new Error("Không tạo được mã thanh toán, vui lòng thử lại");
}

// Tên ngân hàng dễ đọc từ mã BIN VietQR (SEPAY_BANK_ID có thể là BIN hoặc tên rút gọn). Không có trong bảng thì hiện nguyên giá trị.
const BANK_NAMES = {
  970422: "MB Bank", 970436: "Vietcombank", 970415: "VietinBank", 970418: "BIDV", 970405: "Agribank", 970407: "Techcombank",
  970416: "ACB", 970432: "VPBank", 970423: "TPBank", 970403: "Sacombank", 970437: "HDBank", 970441: "VIB",
  970443: "SHB", 970448: "OCB", 970426: "MSB", 970440: "SeABank", 970431: "Eximbank", 970449: "LPBank",
};
const bankDisplayName = (bankId) => BANK_NAMES[bankId] || bankId;

// ---- Tài khoản nhận tiền ----
const NOT_CONFIGURED = { bankId: "", accountNumber: "", accountName: "", source: "none" };
let cache = { value: null, expires: 0 };

const fromEnv = () => ({
  bankId: (process.env.SEPAY_BANK_ID || "").trim(),
  accountNumber: (process.env.SEPAY_ACCOUNT_NO || "").replace(/\s/g, ""),
  accountName: (process.env.SEPAY_ACCOUNT_NAME || "").trim(),
  source: "env",
});

async function getBankConfig() {
  const env = fromEnv();
  if (env.bankId && env.accountNumber) return env;

  if (cache.value && Date.now() < cache.expires) return cache.value;
  try {
    const base = process.env.CLIENT_SERVER_URL || "http://localhost:5000";
    const res = await fetch(`${base}/api/payments/bank-info`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const value = data.bankId && data.accountNumber ? { bankId: data.bankId, accountNumber: String(data.accountNumber), accountName: data.accountName || "", source: "client-server" } : NOT_CONFIGURED;
    cache = { value, expires: Date.now() + 60 * 1000 };
    return value;
  } catch (err) {
    // Client Server tạm không phản hồi: dùng lại giá trị lần trước nếu có; không thì coi như chưa cấu hình.
    // Cache ngắn (15s) để không bắt mỗi yêu cầu của khách chờ timeout.
    const value = cache.value && cache.value.bankId ? cache.value : NOT_CONFIGURED;
    cache = { value, expires: Date.now() + 15 * 1000 };
    return value;
  }
}
const isBankConfigured = (cfg) => Boolean(cfg.bankId && cfg.accountNumber);

// Cùng định dạng QR với Client Web (img.vietqr.io, qr_only) để 2 giao diện hiển thị y hệt nhau.
const buildQrUrl = (cfg, amount, content) => {
  if (!isBankConfigured(cfg)) return null;
  const base = `https://img.vietqr.io/image/${cfg.bankId}-${cfg.accountNumber}-qr_only.png`;
  return amount ? `${base}?amount=${amount}&addInfo=${encodeURIComponent(content)}` : base;
};

// Dùng cho test để không bị cache của lần chạy trước.
const resetBankCache = () => {
  cache = { value: null, expires: 0 };
};

// Thông tin để khách thanh toán 1 đơn chuyển khoản. Số tiền = phần CÒN THIẾU (chuyển thiếu thì QR lần sau chỉ đòi phần còn lại).
// Chưa cấu hình tài khoản → qrUrl = null và configured = false: giao diện hiện cảnh báo + nút giả lập (chỉ ở môi trường dev).
function buildPaymentInfo(order, cfg) {
  if (order.paymentMethod !== "bank_transfer" || !order.paymentCode) return null;
  const amount = Math.max(0, order.totalVnd - (order.paidVnd || 0));
  return {
    method: "bank_transfer",
    configured: isBankConfigured(cfg),
    bankId: cfg.bankId,
    bank: bankDisplayName(cfg.bankId),
    accountNumber: cfg.accountNumber,
    accountName: cfg.accountName,
    content: order.paymentCode,
    amount,
    total: order.totalVnd,
    paid: order.paidVnd || 0,
    qrUrl: buildQrUrl(cfg, amount, order.paymentCode),
    expiresAt: order.paymentExpiresAt || null,
  };
}

// Cho phép đặt chuyển khoản khi chưa có tài khoản thật CHỈ ở môi trường dev (để thử luồng với nút giả lập);
// production mà chưa cấu hình thì ẩn lựa chọn này, tránh khách chuyển tiền vào "hư không".
const canUseBankTransfer = (cfg) => isBankConfigured(cfg) || process.env.NODE_ENV !== "production";

module.exports = {
  PAYMENT_WINDOW_MS,
  CODE_PREFIX,
  generatePaymentCode,
  getBankConfig,
  isBankConfigured,
  canUseBankTransfer,
  buildQrUrl,
  buildPaymentInfo,
  bankDisplayName,
  resetBankCache,
};
