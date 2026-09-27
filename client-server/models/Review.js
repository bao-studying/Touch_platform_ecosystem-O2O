const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    // 0 = góp ý riêng gửi thẳng (không đi qua luồng chấm sao), 1-5 = có chấm sao
    rating: { type: Number, required: true, min: 0, max: 5, default: 0 },
    // Góp ý nội bộ chỉ có khi rating thấp hơn ngưỡng (reviewThreshold), hoặc gửi thẳng qua "Góp ý riêng"
    feedbackText: { type: String, default: "" },
    // "redirected_public": khách đã được đưa sang Google Maps/Shopee
    // "internal": góp ý nội bộ gửi thẳng Admin (bao gồm cả "Góp ý riêng" không chấm sao)
    channel: { type: String, enum: ["redirected_public", "internal"], required: true },
    status: { type: String, enum: ["new", "seen", "resolved"], default: "new" },
    branch: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
