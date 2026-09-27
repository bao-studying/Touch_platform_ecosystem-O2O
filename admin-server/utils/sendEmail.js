const nodemailer = require("nodemailer");

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransporter;
};

// Gửi email — nếu chưa cấu hình SMTP (.env), sẽ KHÔNG lỗi mà chỉ in link ra console (chế độ demo/dev),
// để flow đăng ký/xác thực vẫn dùng thử được ngay cả khi chưa nối dịch vụ mail thật (Nodemailer/SendGrid...).
const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  const fromName = process.env.MAIL_FROM_NAME || "O2O Brand Platform";
  const fromAddress = process.env.SMTP_USER || "no-reply@o2obrand.local";

  if (!transporter) {
    console.log("\n📧 [DEV MODE — chưa cấu hình SMTP] Email sẽ gửi tới:", to);
    console.log("   Tiêu đề:", subject);
    console.log("   Nội dung (HTML):", html, "\n");
    return { devMode: true };
  }

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    html,
  });
  return { devMode: false };
};

module.exports = sendEmail;
