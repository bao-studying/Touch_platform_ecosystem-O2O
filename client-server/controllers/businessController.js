const Business = require("../models/Business");
const Link = require("../models/Link");
const { getPlanLimits, diffUnlockedFeatures, PLAN_ORDER } = require("../config/planLimits");
const { ensureActivePlan, applyPlanChange } = require("../utils/planGate");

const slugify = (str) =>
  str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/đ/g, "d")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// @desc  Tạo hồ sơ doanh nghiệp cho admin đang đăng nhập
// @route POST /api/business
const createBusiness = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Vui lòng nhập tên doanh nghiệp" });

    let baseSlug = slugify(name) || "shop";
    let slug = baseSlug;
    let counter = 1;
    while (await Business.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const business = await Business.create({
      owner: req.admin._id,
      name,
      slug,
      planHistory: [{ plan: "free", changedAt: new Date() }],
    });

    res.status(201).json(business);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo doanh nghiệp", error: err.message });
  }
};

// @desc  Lấy danh sách doanh nghiệp của admin đang đăng nhập
// @route GET /api/business/mine
const getMyBusinesses = async (req, res) => {
  const businesses = await Business.find({ owner: req.admin._id }).sort({ createdAt: -1 });
  await Promise.all(businesses.map((b) => ensureActivePlan(b)));
  res.json(businesses);
};

// @desc  Lấy 1 doanh nghiệp theo id (chỉ chủ sở hữu)
// @route GET /api/business/:id
const getBusinessById = async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
  if (business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Bạn không có quyền truy cập doanh nghiệp này" });
  }
  await ensureActivePlan(business);
  res.json(business);
};

// @desc  Cập nhật hồ sơ doanh nghiệp (live edit từ Setup Tab) — KHÔNG dùng để đổi gói, xem changePlan
// @route PUT /api/business/:id
const updateBusiness = async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
  if (business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa doanh nghiệp này" });
  }
  await ensureActivePlan(business);

  const editableFields = [
    "name",
    "logoUrl",
    "coverUrl",
    "bio",
    "mascotUrl",
    "googleMapsLink",
    "googlePlaceId",
    "shopeeLink",
    "wifiInfo",
    "hotline",
    "loyaltyOfferText",
    "reviewThreshold",
    "branches",
    "privateFeedbackEnabled",
    "feedbackPromptText",
  ];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) business[field] = req.body[field];
  });

  // theme là object lồng — merge từng phần thay vì ghi đè toàn bộ
  if (req.body.theme) {
    if (req.body.theme.primaryColor !== undefined) business.theme.primaryColor = req.body.theme.primaryColor;
    if (req.body.theme.buttonStyle !== undefined) business.theme.buttonStyle = req.body.theme.buttonStyle;
    if (req.body.theme.fontFamily !== undefined) {
      // Chọn kiểu chữ là tính năng Level 1+ — chặn thật ở server, không chỉ ẩn ở giao diện
      if (!getPlanLimits(business.plan).hasFontPicker && req.body.theme.fontFamily !== "fraunces") {
        return res.status(403).json({
          message: "Chọn kiểu chữ thương hiệu cần nâng cấp lên Level 1 trở lên.",
          code: "PLAN_LIMIT_FONT",
        });
      }
      business.theme.fontFamily = req.body.theme.fontFamily;
    }
  }

  await business.save();
  res.json(business);
};

// @desc  Đổi gói dịch vụ — ghi lịch sử + đặt hạn 30 ngày (demo, chưa nối thanh toán SePay thật)
// @route PUT /api/business/:id/plan
const changePlan = async (req, res) => {
  const business = await Business.findById(req.params.id);
  if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
  if (business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Bạn không có quyền" });
  }
  await ensureActivePlan(business);

  const { plan } = req.body;
  if (!PLAN_ORDER.includes(plan)) return res.status(400).json({ message: "Gói không hợp lệ" });

  const oldPlan = business.plan;
  const unlockedFeatures = diffUnlockedFeatures(oldPlan, plan);

  await applyPlanChange(business, plan);

  res.json({ business, unlockedFeatures });
};

// @desc  Lịch sử nâng cấp gói — dùng cho trang Cài đặt tài khoản
// @route GET /api/business/:id/history
const getPlanHistory = async (req, res) => {
  const business = await Business.findById(req.params.id).select("planHistory owner");
  if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
  if (business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Bạn không có quyền" });
  }
  res.json([...business.planHistory].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt)));
};

// @desc  Lấy Landing Page công khai (business + links active) theo slug — KHÔNG cần đăng nhập
// @route GET /api/business/public/:slug
const getPublicBusinessBySlug = async (req, res) => {
  const business = await Business.findOne({ slug: req.params.slug });
  if (!business) return res.status(404).json({ message: "Không tìm thấy trang này" });
  await ensureActivePlan(business);

  const links = await Link.find({ business: business._id, active: true }).sort({ order: 1 });
  const limits = getPlanLimits(business.plan);

  res.json({
    _id: business._id,
    name: business.name,
    slug: business.slug,
    logoUrl: business.logoUrl,
    coverUrl: business.coverUrl,
    bio: business.bio,
    mascotUrl: business.mascotUrl,
    googleMapsLink: business.googleMapsLink,
    googlePlaceId: business.googlePlaceId,
    shopeeLink: business.shopeeLink,
    reviewThreshold: business.reviewThreshold,
    loyaltyOfferText: business.loyaltyOfferText,
    privateFeedbackEnabled: business.privateFeedbackEnabled,
    feedbackPromptText: business.feedbackPromptText,
    theme: business.theme,
    plan: business.plan,
    // Cờ tính năng đã tính sẵn — frontend công khai KHÔNG cần biết luật, chỉ cần đọc cờ
    features: {
      hasLoyalty: limits.hasLoyalty,
      hasSmartReview: limits.hasSmartReview,
      showsAds: limits.showsAds,
    },
    links,
  });
};

module.exports = {
  createBusiness,
  getMyBusinesses,
  getBusinessById,
  updateBusiness,
  changePlan,
  getPlanHistory,
  getPublicBusinessBySlug,
};
