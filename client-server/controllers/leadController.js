const Lead = require("../models/Lead");
const Business = require("../models/Business");
const { getPlanLimits } = require("../config/planLimits");
const { ensureActivePlan } = require("../utils/planGate");
const { capString, isValidEmail, isPlainIdString } = require("../utils/sanitize");

// @desc  Khách đăng ký Khách hàng thân thiết (public) — CHẶN nếu gói chưa mở Loyalty (Free)
// @route POST /api/leads/public
const submitLead = async (req, res) => {
  try {
    const { businessId, dob } = req.body;
    const name = capString(req.body.name, 100);
    const phone = capString(req.body.phone, 20);
    const email = capString(req.body.email, 254);
    const zalo = capString(req.body.zalo, 20);
    const branch = capString(req.body.branch, 100);

    if (!isPlainIdString(businessId) || !name) {
      return res.status(400).json({ message: "Thiếu thông tin doanh nghiệp hoặc tên khách hàng" });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Email không hợp lệ" });
    }
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
    await ensureActivePlan(business);

    if (!getPlanLimits(business.plan).hasLoyalty) {
      return res.status(403).json({ message: "Tính năng Khách hàng thân thiết chưa được kích hoạt" });
    }

    const lead = await Lead.create({
      business: businessId,
      name,
      phone,
      email,
      zalo,
      dob: dob || undefined,
      branch,
    });

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi đăng ký khách hàng thân thiết", error: err.message });
  }
};

// @desc  Admin xem danh sách khách hàng (CRM)
// @route GET /api/leads/business/:businessId
const getLeadsByBusiness = async (req, res) => {
  const business = await Business.findById(req.params.businessId);
  if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
  if (business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }

  const leads = await Lead.find({ business: req.params.businessId }).sort({ createdAt: -1 });
  res.json(leads);
};

// @desc  Xuất CSV danh sách khách hàng — CHẶN nếu gói chưa mở CRM Export (Free)
// @route GET /api/leads/business/:businessId/export
const exportLeadsCsv = async (req, res) => {
  const business = await Business.findById(req.params.businessId);
  if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
  if (business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }
  await ensureActivePlan(business);
  if (!getPlanLimits(business.plan).hasCrmExport) {
    return res.status(403).json({ message: "Xuất CSV chưa được mở ở gói hiện tại. Nâng cấp lên Level 1 trở lên." });
  }

  const leads = await Lead.find({ business: req.params.businessId }).sort({ createdAt: -1 });

  const escapeCsv = (val = "") => `"${String(val).replace(/"/g, '""')}"`;
  const header = ["Họ tên", "Số điện thoại", "Email", "Zalo", "Ngày sinh", "Chi nhánh", "Điểm", "Ngày đăng ký"];
  const rows = leads.map((l) =>
    [
      l.name,
      l.phone,
      l.email,
      l.zalo,
      l.dob ? new Date(l.dob).toLocaleDateString("vi-VN") : "",
      l.branch,
      l.points,
      new Date(l.createdAt).toLocaleDateString("vi-VN"),
    ]
      .map(escapeCsv)
      .join(",")
  );
  const csv = "\uFEFF" + [header.map(escapeCsv).join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="crm-${business.slug}.csv"`);
  res.send(csv);
};

module.exports = { submitLead, getLeadsByBusiness, exportLeadsCsv };
