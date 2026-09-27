// Kiểm tra "lazy": gọi hàm này mỗi khi đọc/ghi 1 Business. Nếu gói trả phí đã quá hạn,
// tự động hạ về Free và LƯU LẠI — nhưng KHÔNG xoá dữ liệu đã có (links, leads, reviews...),
// chỉ ảnh hưởng tới việc tạo/sửa mới các tính năng thuộc gói cao hơn.
const ensureActivePlan = async (business) => {
  if (business.plan !== "free" && business.planExpiresAt && business.planExpiresAt < new Date()) {
    business.plan = "free";
    business.planExpiresAt = null;
    business.planHistory.push({ plan: "free", changedAt: new Date() });
    await business.save();
  }
  return business;
};

// Áp dụng đổi gói (dùng chung cho đổi trực tiếp/miễn phí VÀ khi thanh toán SePay thành công).
// Gói trả phí luôn đặt hạn 30 ngày kể từ lúc áp dụng.
const applyPlanChange = async (business, plan) => {
  business.plan = plan;
  business.planExpiresAt = plan === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  business.planHistory.push({ plan, changedAt: new Date() });
  await business.save();
  return business;
};

module.exports = { ensureActivePlan, applyPlanChange };
