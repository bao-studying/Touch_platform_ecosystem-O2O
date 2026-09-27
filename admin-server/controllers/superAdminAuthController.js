const SuperAdmin = require("../models/SuperAdmin");
const generateSuperAdminToken = require("../utils/generateSuperAdminToken");

// @desc  Đăng nhập Super Admin — dùng cho trang /super-admin/login, và được trang /login (đăng nhập thường)
//        gọi tới khi tài khoản đăng nhập không khớp Tenant nhưng khớp tài khoản Super Admin.
// @route POST /api/super-admin/auth/login
const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const account = await SuperAdmin.findOne({ email: (email || "").toLowerCase().trim() });

    if (account && (await account.matchPassword(password))) {
      account.lastLoginAt = new Date();
      await account.save();
      return res.json({
        _id: account._id,
        name: account.name,
        email: account.email,
        role: "superadmin",
        token: generateSuperAdminToken(account._id),
      });
    }

    res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ khi đăng nhập", error: err.message });
  }
};

// @desc  Lấy thông tin Super Admin đang đăng nhập
// @route GET /api/super-admin/auth/me
const getSuperAdminMe = async (req, res) => res.json(req.superAdmin);

module.exports = { loginSuperAdmin, getSuperAdminMe };
