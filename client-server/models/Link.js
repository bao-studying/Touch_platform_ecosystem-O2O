const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    platform: {
      type: String,
      enum: ["facebook", "tiktok", "shopee", "zalo", "website", "wifi", "hotline", "instagram", "youtube", "email"],
      required: true,
    },
    label: { type: String, default: "" }, // tên hiển thị tuỳ chỉnh
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
    animation: {
      type: String,
      enum: ["stationary", "marquee", "orbit", "bouncing"],
      default: "stationary",
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Link", linkSchema);
