const mongoose = require("mongoose");

const planOrderSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    plan: { type: String, enum: ["level1", "level2", "level3"], required: true },
    amount: { type: Number, required: true },
    orderCode: { type: String, required: true, unique: true }, // = nội dung chuyển khoản, dùng để đối soát webhook
    status: { type: String, enum: ["pending", "paid", "expired"], default: "pending" },
    expiresAt: { type: Date, required: true }, // 15 phút kể từ lúc tạo
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlanOrder", planOrderSchema);
