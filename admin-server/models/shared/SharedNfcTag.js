const mongoose = require("mongoose");

// Trỏ chung vào collection "nfctags" — Admin Server chỉ ĐỌC (đếm tổng số chip đã kích hoạt cho Overview).
const sharedNfcTagSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business" },
    locked: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "nfctags", strict: false }
);

module.exports = mongoose.model("NfcTag", sharedNfcTagSchema);
