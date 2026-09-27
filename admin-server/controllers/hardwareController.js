const HardwareProduct = require("../models/HardwareProduct");
const { emitPublic } = require("../sockets");

const listPublicHardware = async (req, res) => {
  const products = await HardwareProduct.find({ isActive: true }).sort({ sortOrder: 1 });
  res.json(products);
};

const listAllHardware = async (req, res) => {
  const products = await HardwareProduct.find({}).sort({ sortOrder: 1 });
  res.json(products);
};

const createHardware = async (req, res) => {
  const { name, type, priceVnd, imageUrl, description } = req.body;
  if (!name || !priceVnd) return res.status(400).json({ message: "Vui lòng nhập tên và giá sản phẩm" });
  const product = await HardwareProduct.create({ name, type, priceVnd, imageUrl, description });
  emitPublic("hardware:updated", {});
  res.status(201).json(product);
};

const updateHardware = async (req, res) => {
  const product = await HardwareProduct.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
  const editable = ["name", "type", "priceVnd", "imageUrl", "description", "isActive", "sortOrder"];
  editable.forEach((key) => {
    if (req.body[key] !== undefined) product[key] = req.body[key];
  });
  await product.save();
  emitPublic("hardware:updated", {});
  res.json(product);
};

const deleteHardware = async (req, res) => {
  const product = await HardwareProduct.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
  await product.deleteOne();
  emitPublic("hardware:updated", {});
  res.json({ message: "Đã xóa sản phẩm" });
};

const ensureSampleHardware = async () => {
  const count = await HardwareProduct.countDocuments({});
  if (count > 0) return;
  await HardwareProduct.insertMany([
    { name: "Mô hình hạt cà phê 3D", type: "Mô hình 3D", priceVnd: 149000, description: "Mô hình decor bàn gắn sẵn chip NFC (NTAG213) + mã QR.", sortOrder: 0 },
    { name: "Biển gỗ để bàn khắc logo", type: "Biển gỗ", priceVnd: 189000, description: "Biển gỗ khắc logo thương hiệu, gắn sẵn chip NFC ở góc dưới.", sortOrder: 1 },
    { name: "Standee mica để quầy thu ngân", type: "Standee mica", priceVnd: 129000, description: "Standee mica trong suốt để quầy, kèm chip NFC + QR in sẵn.", sortOrder: 2 },
  ]);
};

module.exports = { listPublicHardware, listAllHardware, createHardware, updateHardware, deleteHardware, ensureSampleHardware };
