const crypto = require("crypto");
const Admin = require("../models/shared/SharedAdmin");
const generateTenantToken = require("../utils/generateTenantToken");
const sendEmail = require("../utils/sendEmail");

// Đăng ký/đăng nhập Tenant NGAY TẠI Admin Server, ghi thẳng vào collection "admins" chung — không gọi sang
// Client Server. Token sinh ra ký bằng JWT_SECRET chung nên dùng lại được bên Client Server (chuyển hướng
// qua ?token= khi cần vào Dashboard thật, xem authHandoff trong tài liệu tích hợp gửi kèm cho Client Web).
//
// @route POST /api/auth/register
const registerTenant = async (req, res) => {
  try {
    const { name, email, password, plan } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên, email và mật khẩu" });
    }
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email này đã được đăng ký" });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const admin = await Admin.create({
      name,
      email,
      password,
      pendingPlan: ["free", "level1", "level2", "level3"].includes(plan) ? plan : "free",
      emailVerifyToken: verifyToken,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyUrl = `${process.env.ADMIN_WEB_URL || "http://localhost:5174"}/verify-email/${verifyToken}`;
    sendEmail({
      to: admin.email,
      subject: "Xác thực email — O2O Brand Promotion",
      html: `<p>Chào ${admin.name},</p><p>Bấm vào liên kết để xác thực email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Liên kết có hiệu lực 24 giờ.</p>`,
    }).catch((err) => console.error("Gửi email xác thực thất bại:", err.message));

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      isEmailVerified: admin.isEmailVerified,
      token: generateTenantToken(admin._id),
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ khi đăng ký", error: err.message });
  }
};

// @route POST /api/auth/login
const loginTenant = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      if (admin.isLocked) return res.status(403).json({ message: "Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ." });
      return res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isEmailVerified: admin.isEmailVerified,
        token: generateTenantToken(admin._id),
      });
    }
    res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ khi đăng nhập", error: err.message });
  }
};

// @route GET /api/auth/me
const getTenantMe = async (req, res) => res.json(req.admin);

// @route GET /api/auth/verify-email/:token
const verifyTenantEmail = async (req, res) => {
  const admin = await Admin.findOne({ emailVerifyToken: req.params.token, emailVerifyExpires: { $gt: new Date() } });
  if (!admin) return res.status(400).json({ message: "Liên kết xác thực không hợp lệ hoặc đã hết hạn" });
  admin.isEmailVerified = true;
  admin.emailVerifyToken = null;
  admin.emailVerifyExpires = null;
  await admin.save();
  res.json({ message: "Xác thực email thành công" });
};

// @route POST /api/auth/resend-verification
const resendTenantVerification = async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  if (admin.isEmailVerified) return res.status(400).json({ message: "Email này đã được xác thực rồi" });
  const verifyToken = crypto.randomBytes(32).toString("hex");
  admin.emailVerifyToken = verifyToken;
  admin.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await admin.save();
  const verifyUrl = `${process.env.ADMIN_WEB_URL || "http://localhost:5174"}/verify-email/${verifyToken}`;
  await sendEmail({
    to: admin.email,
    subject: "Xác thực email — O2O Brand Promotion",
    html: `<p>Bấm vào liên kết để xác thực email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
  res.json({ message: "Đã gửi lại email xác thực" });
};

module.exports = { registerTenant, loginTenant, getTenantMe, verifyTenantEmail, resendTenantVerification };
