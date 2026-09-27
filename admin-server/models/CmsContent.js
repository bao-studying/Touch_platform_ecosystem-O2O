const mongoose = require("mongoose");

// Nội dung các khối trên SaaS Landing Page công khai — Super Admin chỉnh qua CMS (rich-text editor),
// không cần đội Dev can thiệp code mỗi khi đổi chương trình khuyến mãi / nội dung marketing.
const cmsContentSchema = new mongoose.Schema(
  {
    // section: "hero" | "about" | "usecases" | "contact_intro" | "footer"
    section: { type: String, required: true, unique: true },
    title: { type: String, default: "" },
    // Nội dung rich-text dạng HTML do trình soạn thảo (Quill) sinh ra.
    bodyHtml: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    ctaLink: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CmsContent", cmsContentSchema);
