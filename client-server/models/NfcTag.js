const mongoose = require("mongoose");

const nfcTagSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true },
    uid: { type: String, required: true, unique: true, trim: true }, // TAG_UID ghi vào URL /p/{slug}?tag={uid}
    itemType: { type: String, default: "gấu bông" }, // loại vật phẩm decor
    branch: { type: String, default: "" },
    locked: { type: Boolean, default: false }, // đã khóa chip chống ghi đè chưa
    activatedAt: { type: Date },
    scanCount: { type: Number, default: 0 },
    activationMethod: { type: String, enum: ["nfc", "qr"], default: "nfc" }, // kích hoạt bằng chip thật hay mã QR demo
    placementNote: { type: String, default: "" }, // ghi chú vị trí đặt thật (VD: "Quầy thu ngân", "Đầu bàn số 3")
  },
  { timestamps: true }
);

module.exports = mongoose.model("NfcTag", nfcTagSchema);
