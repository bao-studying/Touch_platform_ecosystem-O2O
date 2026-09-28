const PlanConfig = require("../models/PlanConfig");
const { emitPublic } = require("../sockets");

const PLAN_ORDER = ["free", "level1", "level2", "level3"];

// NGUỒN GIÁ DUY NHẤT là priceVnd (số tiền thật dùng tạo đơn SePay/QR). Nhãn hiển thị luôn được SINH
// ra từ nó — không còn ô nhãn nhập tay riêng, nên không thể xảy ra chuyện "hiện giá mới nhưng thu giá cũ".
const buildPriceLabel = (priceVnd) =>
  Number(priceVnd) === 0 ? "0đ" : `${Number(priceVnd).toLocaleString("vi-VN")}đ/tháng`;
const withLabel = (plan) => ({ ...plan.toObject(), priceLabel: buildPriceLabel(plan.priceVnd) });

// @route GET /api/public/plans
const listPublicPlans = async (req, res) => {
  const plans = await PlanConfig.find({ isActive: true }).sort({ sortOrder: 1 });
  res.json(plans.map(withLabel));
};

// @route GET /api/super-admin/plans
const listAllPlans = async (req, res) => {
  const plans = await PlanConfig.find({}).sort({ sortOrder: 1 });
  res.json(plans.map(withLabel));
};

// @route PUT /api/super-admin/plans/:id
const updatePlan = async (req, res) => {
  const plan = await PlanConfig.findById(req.params.id);
  if (!plan) return res.status(404).json({ message: "Không tìm thấy gói" });
  const editable = ["name", "priceVnd", "tagline", "features", "branchLimit", "isActive", "sortOrder"];
  editable.forEach((key) => {
    if (req.body[key] !== undefined) plan[key] = req.body[key];
  });
  plan.priceLabel = buildPriceLabel(plan.priceVnd); // đồng bộ nhãn lưu trong DB theo giá thật
  await plan.save();
  // Phát sự kiện real-time — Store công khai VÀ Store trong Admin Dashboard của Client Server (nếu đã
  // wire theo hướng dẫn tích hợp) sẽ tự refetch giá mới ngay, không cần tải lại trang.
  emitPublic("plan:updated", { planKey: plan.planKey });
  res.json(withLabel(plan));
};

const ensureDefaultPlans = async () => {
  const defaults = {
    free: { name: "Free", priceVnd: 0, priceLabel: "0đ", tagline: "Trang giới thiệu cơ bản, có gắn thương hiệu O2O Brand.", features: ["Landing Page cơ bản", "Tối đa 2 Social Links", "Có gắn thương hiệu O2O"], branchLimit: 1, sortOrder: 0 },
    level1: { name: "Level 1", priceVnd: 99000, priceLabel: "99.000đ/tháng", tagline: "Bắt đầu thu thập dữ liệu khách hàng.", features: ["Mọi tính năng Free", "Không giới hạn Social Links", "Loyalty Lead Capture", "CRM + Xuất CSV"], branchLimit: 1, sortOrder: 1 },
    level2: { name: "Level 2", priceVnd: 199000, priceLabel: "199.000đ/tháng", tagline: "Chủ động quản lý danh tiếng thương hiệu.", features: ["Mọi tính năng Level 1", "Smart Review (gating thông minh)", "Animation Marquee/Orbit", "Không hiển thị quảng cáo"], branchLimit: 1, sortOrder: 2 },
    level3: { name: "Level 3", priceVnd: 299000, priceLabel: "299.000đ/tháng", tagline: "Dành cho chuỗi nhiều chi nhánh.", features: ["Mọi tính năng Level 2", "Quản lý đa chi nhánh"], branchLimit: 10, sortOrder: 3 },
  };
  for (const key of PLAN_ORDER) {
    const exists = await PlanConfig.findOne({ planKey: key });
    if (!exists) await PlanConfig.create({ planKey: key, ...defaults[key] });
  }
};

module.exports = { listPublicPlans, listAllPlans, updatePlan, ensureDefaultPlans };
