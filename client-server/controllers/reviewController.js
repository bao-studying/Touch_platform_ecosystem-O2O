const Review = require("../models/Review");
const Business = require("../models/Business");
const { getPlanLimits } = require("../config/planLimits");
const { ensureActivePlan } = require("../utils/planGate");
const { capString, isPlainIdString } = require("../utils/sanitize");

// Ưu tiên đường dẫn "Viết đánh giá" thẳng (cần Google Place ID) — nếu chưa có, fallback về link Maps thường,
// rồi tới link Shopee. Dùng chung cho cả luồng Smart Review lẫn luồng đơn giản (Free/Level 1).
const getPublicReviewUrl = (business) => {
  if (business.googlePlaceId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(business.googlePlaceId)}`;
  }
  return business.googleMapsLink || business.shopeeLink || null;
};

// @desc  Khách gửi đánh giá sao (public, không cần đăng nhập)
// @route POST /api/reviews/public
// body: { businessId, rating, feedbackText?, branch? }
const submitReview = async (req, res) => {
  try {
    const { businessId, rating } = req.body;
    if (!isPlainIdString(businessId)) {
      return res.status(400).json({ message: "Mã doanh nghiệp không hợp lệ" });
    }
    const feedbackText = capString(req.body.feedbackText, 1000);
    const branch = capString(req.body.branch, 100);

    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
    await ensureActivePlan(business);

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Số sao không hợp lệ" });
    }

    const hasSmartReview = getPlanLimits(business.plan).hasSmartReview;
    // Free/Level 1: chưa có Smart Review gating — MỌI mức sao đều đi thẳng ra đánh giá công khai
    // (form đơn giản, không phân luồng nội bộ). Level 2+: giữ nguyên gating theo reviewThreshold.
    const channel = !hasSmartReview || numRating >= business.reviewThreshold ? "redirected_public" : "internal";

    const review = await Review.create({
      business: businessId,
      rating: numRating,
      feedbackText: channel === "internal" ? feedbackText : "",
      channel,
      branch,
    });

    res.status(201).json({
      review,
      redirectUrl: channel === "redirected_public" ? getPublicReviewUrl(business) : null,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi gửi đánh giá", error: err.message });
  }
};

// @desc  Khách gửi "Góp ý riêng" thẳng cho chủ quán (public, không cần đăng nhập, không đi qua
//        luồng chấm sao/redirect) — luôn là kênh nội bộ, hiển thị trong trang "Góp ý" của Admin.
// @route POST /api/reviews/public/private
// body: { businessId, feedbackText, rating? (0-5, không bắt buộc), branch? }
const submitPrivateFeedback = async (req, res) => {
  try {
    const { businessId, rating } = req.body;
    if (!isPlainIdString(businessId)) {
      return res.status(400).json({ message: "Mã doanh nghiệp không hợp lệ" });
    }
    const feedbackText = capString(req.body.feedbackText, 1000);
    const branch = capString(req.body.branch, 100);
    if (!feedbackText) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung góp ý" });
    }
    const business = await Business.findById(businessId);
    if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
    await ensureActivePlan(business);

    const numRating = Number(rating) || 0;

    const review = await Review.create({
      business: businessId,
      rating: numRating >= 0 && numRating <= 5 ? numRating : 0,
      feedbackText,
      channel: "internal",
      branch,
    });

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi gửi góp ý", error: err.message });
  }
};

// @desc  Admin xem danh sách đánh giá (đặc biệt các review nội bộ 1-3 sao)
// @route GET /api/reviews/business/:businessId
const getReviewsByBusiness = async (req, res) => {
  const business = await Business.findById(req.params.businessId);
  if (!business) return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
  if (business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }

  const { channel } = req.query; // optional filter: internal | redirected_public
  const query = { business: req.params.businessId };
  if (channel) query.channel = channel;

  const reviews = await Review.find(query).sort({ createdAt: -1 });
  res.json(reviews);
};

// @desc  Cập nhật trạng thái xử lý góp ý nội bộ
// @route PUT /api/reviews/:id/status
const updateReviewStatus = async (req, res) => {
  const review = await Review.findById(req.params.id).populate("business");
  if (!review) return res.status(404).json({ message: "Không tìm thấy đánh giá" });
  if (review.business.owner.toString() !== req.admin._id.toString()) {
    return res.status(403).json({ message: "Không có quyền" });
  }

  review.status = req.body.status || review.status;
  await review.save();
  res.json(review);
};

module.exports = { submitReview, submitPrivateFeedback, getReviewsByBusiness, updateReviewStatus };
