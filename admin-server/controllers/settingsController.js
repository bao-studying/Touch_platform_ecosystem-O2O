const PlatformSettings = require("../models/PlatformSettings");
const SuperAdmin = require("../models/SuperAdmin");
const { getBankConfig, isBankConfigured, buildQrUrl, bankDisplayName } = require("../utils/payment");

// @desc  Thông tin hỗ trợ công khai (Zalo/hotline) — cho Footer & trang Liên hệ hiển thị, KHÔNG lộ dữ liệu nhạy cảm
// @route GET /api/public/support-info
const getPublicSupportInfo = async (req, res) => {
  const settings = await PlatformSettings.findOne({ singleton: "main" });
  res.json({
    supportZalo: settings?.supportZalo || "",
    supportHotline: settings?.supportHotline || "",
  });
};

// @desc  Lấy cấu hình hệ thống + trạng thái đã cấu hình ENV hay chưa (không lộ giá trị secret thật)
// @route GET /api/super-admin/settings
const getSettings = async (req, res) => {
  let settings = await PlatformSettings.findOne({ singleton: "main" });
  if (!settings) settings = await PlatformSettings.create({ singleton: "main" });

  // Tài khoản nhận tiền SePay — DÙNG CHUNG với Client Web/Client Server (chỉ đọc, không cần nhập lại ở đâu cả).
  const bank = await getBankConfig();

  res.json({
    settings,
    envStatus: {
      mailConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      sepayConfigured: isBankConfigured(bank),
      mongoConfigured: Boolean(process.env.MONGO_URI),
    },
    superAdminAccount: { name: req.superAdmin.name, email: req.superAdmin.email },
    payment: {
      configured: isBankConfigured(bank),
      source: bank.source, // "env" (SEPAY_* ở .env Admin Server) | "client-server" (tự lấy từ Client Server) | "none"
      bankId: bank.bankId,
      bank: bankDisplayName(bank.bankId),
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      qrUrl: buildQrUrl(bank, 0, ""), // QR nhận tiền không kèm số tiền
    },
  });
};

// @desc  Cập nhật các trường không nhạy cảm (tên gửi mail, email nhận thông báo, hotline/zalo hỗ trợ)
// @route PUT /api/super-admin/settings
const updateSettings = async (req, res) => {
  const editable = ["mailFromName", "notificationEmail", "supportZalo", "supportHotline"];
  const patch = {};
  editable.forEach((key) => {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  });
  const settings = await PlatformSettings.findOneAndUpdate({ singleton: "main" }, { $set: patch }, { new: true, upsert: true });
  res.json(settings);
};

// @desc  Đổi email/mật khẩu đăng nhập Super Admin (đồng thời là thông tin Easter Egg ở Form Liên hệ)
// @route PUT /api/super-admin/settings/credentials
const updateSuperAdminCredentials = async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const account = await SuperAdmin.findById(req.superAdmin._id);

  if (newPassword) {
    const matches = await account.matchPassword(currentPassword || "");
    if (!matches) return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });
    if (newPassword.length < 6) return res.status(400).json({ message: "Mật khẩu mới cần tối thiểu 6 ký tự" });
    account.password = newPassword;
  }
  if (name) account.name = name;
  if (email) account.email = email.toLowerCase().trim();
  await account.save();
  res.json({ message: "Đã cập nhật thông tin đăng nhập Super Admin", name: account.name, email: account.email });
};

module.exports = { getSettings, updateSettings, updateSuperAdminCredentials, getPublicSupportInfo };
