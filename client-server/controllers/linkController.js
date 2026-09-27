const Link = require("../models/Link");
const Business = require("../models/Business");
const { getPlanLimits } = require("../config/planLimits");
const { ensureActivePlan } = require("../utils/planGate");

// Helper: xác nhận business thuộc về admin đang đăng nhập, trả kèm business đã ensureActivePlan
const assertOwnership = async (businessId, adminId) => {
  const business = await Business.findById(businessId);
  if (!business) return { error: "Không tìm thấy doanh nghiệp", status: 404 };
  if (business.owner.toString() !== adminId.toString()) {
    return { error: "Bạn không có quyền chỉnh sửa doanh nghiệp này", status: 403 };
  }
  await ensureActivePlan(business);
  return { business };
};

// @desc  Lấy tất cả link của 1 business (dùng cho Setup Tab)
// @route GET /api/links/business/:businessId
const getLinksByBusiness = async (req, res) => {
  const { error, status } = await assertOwnership(req.params.businessId, req.admin._id);
  if (error) return res.status(status).json({ message: error });

  const links = await Link.find({ business: req.params.businessId }).sort({ order: 1 });
  res.json(links);
};

// @desc  Thêm link mới — CHẶN theo giới hạn số lượng của gói (Free: 2)
// @route POST /api/links
const createLink = async (req, res) => {
  const { business: businessId, platform, url, label, animation, order } = req.body;
  const { error, status, business } = await assertOwnership(businessId, req.admin._id);
  if (error) return res.status(status).json({ message: error });

  const limits = getPlanLimits(business.plan);
  const currentCount = await Link.countDocuments({ business: businessId });
  if (currentCount >= limits.maxSocialLinks) {
    return res.status(403).json({
      message: `Gói ${business.plan.toUpperCase()} chỉ cho phép tối đa ${limits.maxSocialLinks} liên kết. Nâng cấp để thêm không giới hạn.`,
      code: "PLAN_LIMIT_LINKS",
    });
  }

  const requestedAnimation = animation || "stationary";
  if (!limits.allowedAnimations.includes(requestedAnimation)) {
    return res.status(403).json({
      message: `Hiệu ứng "${requestedAnimation}" chưa mở ở gói hiện tại. Nâng cấp lên Level 2 để dùng Marquee/Orbit.`,
      code: "PLAN_LIMIT_ANIMATION",
    });
  }

  const link = await Link.create({
    business: businessId,
    platform,
    url,
    label: label || "",
    animation: requestedAnimation,
    order: order ?? 0,
  });
  res.status(201).json(link);
};

// @desc  Cập nhật link (url, label, animation, thứ tự, ẩn/hiện) — CHẶN animation ngoài gói
// @route PUT /api/links/:id
const updateLink = async (req, res) => {
  const link = await Link.findById(req.params.id);
  if (!link) return res.status(404).json({ message: "Không tìm thấy link" });

  const { error, status, business } = await assertOwnership(link.business, req.admin._id);
  if (error) return res.status(status).json({ message: error });

  if (req.body.animation !== undefined) {
    const limits = getPlanLimits(business.plan);
    if (!limits.allowedAnimations.includes(req.body.animation)) {
      return res.status(403).json({
        message: `Hiệu ứng "${req.body.animation}" chưa mở ở gói hiện tại. Nâng cấp lên Level 2 để dùng Marquee/Orbit.`,
        code: "PLAN_LIMIT_ANIMATION",
      });
    }
  }

  const editableFields = ["platform", "label", "url", "order", "animation", "active"];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) link[field] = req.body[field];
  });

  await link.save();
  res.json(link);
};

// @desc  Xóa link
// @route DELETE /api/links/:id
const deleteLink = async (req, res) => {
  const link = await Link.findById(req.params.id);
  if (!link) return res.status(404).json({ message: "Không tìm thấy link" });

  const { error, status } = await assertOwnership(link.business, req.admin._id);
  if (error) return res.status(status).json({ message: error });

  await link.deleteOne();
  res.json({ message: "Đã xóa link" });
};

module.exports = { getLinksByBusiness, createLink, updateLink, deleteLink };
