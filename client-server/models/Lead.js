const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    zalo: { type: String, default: "" },
    dob: { type: Date },
    branch: { type: String, default: "" }, // chi nhánh đã quét
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
