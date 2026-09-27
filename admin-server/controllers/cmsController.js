const CmsContent = require("../models/CmsContent");
const { emitPublic } = require("../sockets");

const getPublicCms = async (req, res) => {
  const sections = await CmsContent.find({});
  const bySection = Object.fromEntries(sections.map((s) => [s.section, s]));
  res.json(bySection);
};

const getAllCmsForAdmin = async (req, res) => {
  const sections = await CmsContent.find({});
  res.json(sections);
};

const upsertCmsSection = async (req, res) => {
  const { section } = req.params;
  const { title, bodyHtml, imageUrl, ctaLabel, ctaLink } = req.body;
  const updated = await CmsContent.findOneAndUpdate(
    { section },
    { $set: { title, bodyHtml, imageUrl, ctaLabel, ctaLink } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  emitPublic("cms:updated", { section });
  res.json(updated);
};

const ensureDefaultCms = async () => {
  const defaults = [
    { section: "hero", title: "Biến mỗi vật decor trên bàn thành một kênh quảng bá thương hiệu", bodyHtml: "<p>O2O Brand Promotion giúp bạn gắn chip NFC/QR lên vật phẩm decor — khách chỉ cần chạm hoặc quét là mở ngay trang thương hiệu, đánh giá 5 sao, và đăng ký thành viên thân thiết.</p>", ctaLabel: "Bắt đầu miễn phí ngay", ctaLink: "/register" },
    { section: "usecases", title: "Phù hợp với mọi mô hình Online-to-Offline", bodyHtml: "<p>Quán cà phê, nhà hàng, spa, cửa hàng bán lẻ... bất kỳ nơi nào có khách ghé bàn/quầy đều có thể dùng O2O để tăng đánh giá 5 sao và thu thập khách hàng thân thiết.</p>" },
    { section: "about", title: "Về O2O Brand Promotion", bodyHtml: "<p>Chúng tôi xây dựng nền tảng SaaS kết nối thế giới vật lý (Offline) và trải nghiệm số (Online) thông qua công nghệ NFC/QR, giúp các doanh nghiệp vừa và nhỏ quảng bá thương hiệu hiệu quả với chi phí hợp lý.</p>" },
    { section: "contact_intro", title: "Liên hệ với chúng tôi", bodyHtml: "<p>Có câu hỏi về sản phẩm, giá, hoặc muốn được tư vấn? Gửi thông tin bên dưới, đội ngũ O2O sẽ phản hồi sớm nhất.</p>" },
  ];
  for (const d of defaults) {
    const exists = await CmsContent.findOne({ section: d.section });
    if (!exists) await CmsContent.create(d);
  }
};

module.exports = { getPublicCms, getAllCmsForAdmin, upsertCmsSection, ensureDefaultCms };
