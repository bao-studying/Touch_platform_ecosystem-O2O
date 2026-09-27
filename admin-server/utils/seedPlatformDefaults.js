const SuperAdmin = require("../models/SuperAdmin");
const { ensureDefaultPlans } = require("../controllers/planConfigController");
const { ensureSampleHardware } = require("../controllers/hardwareController");
const { ensureDefaultCms } = require("../controllers/cmsController");

const seedPlatformDefaults = async () => {
  try {
    const count = await SuperAdmin.countDocuments({});
    if (count === 0) {
      const email = process.env.SUPER_ADMIN_SEED_EMAIL || "owner@o2obrand.local";
      const password = process.env.SUPER_ADMIN_SEED_PASSWORD || "ChangeMe123!";
      await SuperAdmin.create({ name: "Chủ nền tảng O2O", email, password });
      console.log(`\n👑 Đã tạo tài khoản Super Admin đầu tiên: ${email}`);
      console.log(`   (Đây cũng là thông tin đăng nhập ẩn "Easter Egg" ở Form Liên hệ — email + mật khẩu này.)`);
      console.log(`   ⚠️  Hãy đổi mật khẩu ngay trong Cài đặt hệ thống sau khi đăng nhập lần đầu.\n`);
    }
    await ensureDefaultPlans();
    await ensureSampleHardware();
    await ensureDefaultCms();
  } catch (err) {
    console.error("Lỗi khi seed dữ liệu mặc định:", err.message);
  }
};

module.exports = seedPlatformDefaults;
