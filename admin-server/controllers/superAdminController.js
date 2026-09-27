const Admin = require("../models/shared/SharedAdmin");
const Business = require("../models/shared/SharedBusiness");
const NfcTag = require("../models/shared/SharedNfcTag");
const PlanConfig = require("../models/PlanConfig");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const generateTenantToken = require("../utils/generateTenantToken");
const { emitToTenant } = require("../sockets");

const fmtVndBackend = (n) => `${(n || 0).toLocaleString("vi-VN")}đ`;

// ============ OVERVIEW ============
// @route GET /api/super-admin/overview
const getOverview = async (req, res) => {
  const [businesses, plans, totalTenants, totalTagsActivated] = await Promise.all([
    Business.find({}),
    PlanConfig.find({}),
    Admin.countDocuments({}),
    NfcTag.countDocuments({ locked: true }),
  ]);

  const priceByPlan = Object.fromEntries(plans.map((p) => [p.planKey, p.priceVnd]));
  const now = new Date();

  const mrr = businesses.reduce((sum, b) => {
    if (b.plan === "free") return sum;
    if (b.planExpiresAt && new Date(b.planExpiresAt) < now) return sum;
    return sum + (priceByPlan[b.plan] || 0);
  }, 0);

  const payingTenants = businesses.filter(
    (b) => b.plan !== "free" && (!b.planExpiresAt || new Date(b.planExpiresAt) >= now)
  ).length;

  const growthMap = {};
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const admins = await Admin.find({ createdAt: { $gte: sixMonthsAgo } }).select("createdAt");
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    growthMap[monthKey(d)] = 0;
  }
  admins.forEach((a) => {
    const key = monthKey(new Date(a.createdAt));
    if (key in growthMap) growthMap[key] += 1;
  });
  const growth = Object.entries(growthMap).map(([month, count]) => ({ month, count }));

  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  let downgrades = 0;
  businesses.forEach((b) => {
    const history = b.planHistory || [];
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const cur = history[i];
      if (prev.plan !== "free" && cur.plan === "free" && new Date(cur.changedAt) >= thirtyDaysAgo) {
        downgrades += 1;
      }
    }
  });
  const churnRate = payingTenants + downgrades > 0 ? downgrades / (payingTenants + downgrades) : 0;

  // ---- Phân bổ theo gói (cho Donut Chart) — đếm trên toàn bộ Business, không chỉ đang trả phí ----
  const planCount = { free: 0, level1: 0, level2: 0, level3: 0 };
  businesses.forEach((b) => {
    planCount[b.plan] = (planCount[b.plan] || 0) + 1;
  });
  const planNameByKey = Object.fromEntries(plans.map((p) => [p.planKey, p.name]));
  const planDistribution = Object.entries(planCount)
    .filter(([, count]) => count > 0)
    .map(([planKey, count]) => ({ planKey, name: planNameByKey[planKey] || planKey, count }));

  // ---- Hoạt động gần đây (cho Activity Feed) — gộp 3 nguồn thật: tài khoản mới, đơn hàng, ticket ----
  const [recentAdmins, recentOrders, recentTickets] = await Promise.all([
    Admin.find({}).sort({ createdAt: -1 }).limit(5).select("name email createdAt"),
    Order.find({}).sort({ createdAt: -1 }).limit(5).populate("tenant", "name").select("tenant totalVnd status createdAt"),
    Ticket.find({}).sort({ createdAt: -1 }).limit(5).populate("tenant", "name").select("tenant subject status createdAt"),
  ]);
  const recentActivity = [
    ...recentAdmins.map((a) => ({
      type: "signup",
      text: `${a.name} vừa đăng ký tài khoản`,
      at: a.createdAt,
    })),
    ...recentOrders.map((o) => ({
      type: "order",
      text: `${o.tenant?.name || "Một khách thuê"} đặt đơn hàng ${fmtVndBackend(o.totalVnd)}`,
      at: o.createdAt,
    })),
    ...recentTickets.map((t) => ({
      type: "ticket",
      text: `${t.tenant?.name || "Một khách thuê"} gửi yêu cầu hỗ trợ: "${t.subject}"`,
      at: t.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 8);

  res.json({
    mrr,
    payingTenants,
    totalTenants,
    totalTagsActivated,
    churnRate: Math.round(churnRate * 1000) / 10,
    growth,
    planDistribution,
    recentActivity,
    note: "Churn Rate là số liệu ước lượng (demo) tính từ lịch sử đổi gói trong Business.planHistory, không phải hệ thống billing snapshot theo tháng thật.",
  });
};

// ============ TENANTS ============
// @route GET /api/super-admin/tenants
const listTenants = async (req, res) => {
  const { q } = req.query;
  const filter = q ? { $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }] } : {};
  const admins = await Admin.find(filter).select("-password").sort({ createdAt: -1 });
  const businesses = await Business.find({ owner: { $in: admins.map((a) => a._id) } });
  const bizByOwner = Object.fromEntries(businesses.map((b) => [b.owner.toString(), b]));
  res.json(admins.map((a) => ({ ...a.toObject(), business: bizByOwner[a._id.toString()] || null })));
};

// @route GET /api/super-admin/tenants/:id
const getTenantDetail = async (req, res) => {
  const admin = await Admin.findById(req.params.id).select("-password");
  if (!admin) return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  const businesses = await Business.find({ owner: admin._id });
  res.json({ admin, businesses });
};

// @route PUT /api/super-admin/tenants/:id/lock
const toggleLockTenant = async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  admin.isLocked = req.body.isLocked;
  admin.lockedReason = req.body.reason || "";
  await admin.save();
  emitToTenant(admin._id.toString(), "account:locked", { isLocked: admin.isLocked, reason: admin.lockedReason });
  res.json({ message: admin.isLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản", admin });
};

// @route PUT /api/super-admin/tenants/:id/reset-password
const resetTenantPassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: "Mật khẩu mới cần tối thiểu 6 ký tự" });
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  admin.password = newPassword;
  await admin.save();
  res.json({ message: "Đã đặt lại mật khẩu cho tài khoản này" });
};

// @desc  "Login as User" — token có thêm claim impersonatedBy để sau này audit nếu cần, Client Server
//        vẫn xác thực bình thường vì claim thừa không ảnh hưởng gì tới payload {id} mà nó đọc.
// @route POST /api/super-admin/tenants/:id/login-as
const loginAsTenant = async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: "Không tìm thấy tài khoản" });
  console.log(`[AUDIT] Super Admin ${req.superAdmin.email} đăng nhập giả lập vào Tenant ${admin.email} lúc ${new Date().toISOString()}`);
  const token = generateTenantToken(admin._id, { impersonatedBy: req.superAdmin._id.toString() });
  res.json({ token, tenantName: admin.name, tenantEmail: admin.email });
};

module.exports = { getOverview, listTenants, getTenantDetail, toggleLockTenant, resetTenantPassword, loginAsTenant };
