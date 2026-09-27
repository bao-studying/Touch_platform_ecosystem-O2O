const ContactSubmission = require("../models/ContactSubmission");

// @desc  Nhận submit Form Liên hệ công khai — chỉ lưu lại thành 1 lượt liên hệ.
//        Đăng nhập Super Admin nay đi qua trang /login (đăng nhập thường) hoặc /super-admin/login,
//        không còn gắn vào form này nữa — xem authController phía Admin Web.
// @route POST /api/contact
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ tên, email và nội dung" });
    }

    await ContactSubmission.create({ name, email, phone, message });
    res.status(201).json({ message: "Cảm ơn bạn đã liên hệ, chúng tôi sẽ phản hồi sớm nhất!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};

module.exports = { submitContact };
