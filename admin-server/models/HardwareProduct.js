const mongoose = require("mongoose");

// Phôi/vật phẩm decor gắn chip NFC bán trên Cửa hàng Phần cứng (public Store & tenant Store).
const hardwareProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, default: "Mô hình 3D" }, // vd: Mô hình 3D, Biển gỗ/Acrylic, Gấu bông
    priceVnd: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    description: { type: String, default: "", maxlength: 500 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HardwareProduct", hardwareProductSchema);
