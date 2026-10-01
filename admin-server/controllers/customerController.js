const mongoose = require("mongoose");
const Admin = require("../models/shared/SharedAdmin");
const CustomerProfile = require("../models/CustomerProfile");
const HardwareProduct = require("../models/HardwareProduct");
const { isValidPhone, normalizePhone, pickAddress, validateAddress } = require("../utils/shipping");

// Tất cả route ở đây đi qua protectTenant → req.admin là khách đã đăng nhập. Khách CHỈ đọc/ghi dữ liệu của chính mình.

const getOrCreateProfile = async (tenantId) => {
  let profile = await CustomerProfile.findOne({ tenant: tenantId });
  if (!profile) profile = await CustomerProfile.create({ tenant: tenantId });
  return profile;
};

// Địa chỉ mặc định luôn đứng đầu danh sách để UI chọn sẵn.
const sortAddresses = (addresses) =>
  [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

const serializeProfile = (admin, profile) => ({
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  isEmailVerified: admin.isEmailVerified,
  phone: profile.phone || "",
  addresses: sortAddresses(profile.addresses.map((a) => a.toObject())),
});

// @route GET /api/customer/profile
const getProfile = async (req, res) => {
  const profile = await getOrCreateProfile(req.admin._id);
  res.json(serializeProfile(req.admin, profile));
};

// @route PUT /api/customer/profile   { name?, phone? }
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ message: "Họ tên không được để trống" });
  }
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ message: "Số điện thoại không hợp lệ (ví dụ: 0901234567)" });
  }
  const profile = await getOrCreateProfile(req.admin._id);
  if (phone !== undefined) profile.phone = normalizePhone(phone);
  await profile.save();

  let admin = req.admin;
  if (name !== undefined) {
    admin = await Admin.findById(req.admin._id).select("-password");
    admin.name = String(name).trim().slice(0, 80);
    await admin.save();
  }
  res.json(serializeProfile(admin, profile));
};

// ---------------- Sổ địa chỉ ----------------
// @route POST /api/customer/addresses
const addAddress = async (req, res) => {
  const data = pickAddress(req.body);
  const error = validateAddress(data);
  if (error) return res.status(400).json({ message: error });

  const profile = await getOrCreateProfile(req.admin._id);
  if (profile.addresses.length >= 10) {
    return res.status(400).json({ message: "Bạn chỉ lưu được tối đa 10 địa chỉ" });
  }
  // Địa chỉ đầu tiên tự thành mặc định; hoặc khi khách chủ động chọn mặc định.
  const makeDefault = profile.addresses.length === 0 || req.body.isDefault === true;
  if (makeDefault) profile.addresses.forEach((a) => (a.isDefault = false));
  profile.addresses.push({ ...data, isDefault: makeDefault });
  await profile.save();
  res.status(201).json(serializeProfile(req.admin, profile));
};

// @route PUT /api/customer/addresses/:id
const updateAddress = async (req, res) => {
  const profile = await getOrCreateProfile(req.admin._id);
  const address = profile.addresses.id(req.params.id);
  if (!address) return res.status(404).json({ message: "Không tìm thấy địa chỉ" });

  const data = pickAddress({ ...address.toObject(), ...req.body });
  const error = validateAddress(data);
  if (error) return res.status(400).json({ message: error });

  Object.assign(address, data);
  if (req.body.isDefault === true) {
    profile.addresses.forEach((a) => (a.isDefault = a._id.equals(address._id)));
  }
  await profile.save();
  res.json(serializeProfile(req.admin, profile));
};

// @route DELETE /api/customer/addresses/:id
const deleteAddress = async (req, res) => {
  const profile = await getOrCreateProfile(req.admin._id);
  const address = profile.addresses.id(req.params.id);
  if (!address) return res.status(404).json({ message: "Không tìm thấy địa chỉ" });

  const wasDefault = address.isDefault;
  address.deleteOne();
  // Xoá địa chỉ mặc định → địa chỉ còn lại đầu tiên thành mặc định.
  if (wasDefault && profile.addresses.length > 0) profile.addresses[0].isDefault = true;
  await profile.save();
  res.json(serializeProfile(req.admin, profile));
};

// ---------------- Giỏ hàng ----------------
// Trả giỏ hàng kèm thông tin sản phẩm ĐANG BÁN (đã ẩn/xoá thì tự loại khỏi giỏ) — giá luôn là giá hiện tại.
const serializeCart = async (profile) => {
  const ids = profile.cart.map((c) => c.product);
  const products = await HardwareProduct.find({ _id: { $in: ids }, isActive: true });
  const byId = Object.fromEntries(products.map((p) => [p._id.toString(), p]));
  return profile.cart
    .filter((c) => byId[c.product.toString()])
    .map((c) => ({ product: byId[c.product.toString()], qty: c.qty }));
};

// @route GET /api/customer/cart
const getCart = async (req, res) => {
  const profile = await getOrCreateProfile(req.admin._id);
  res.json(await serializeCart(profile));
};

// @route PUT /api/customer/cart   { items: [{ productId, qty }] }  — ghi đè toàn bộ giỏ
const saveCart = async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ message: "Dữ liệu giỏ hàng không hợp lệ" });

  const merged = new Map();
  for (const i of items) {
    if (!mongoose.isValidObjectId(i?.productId)) continue;
    const qty = Math.min(99, Math.floor(Number(i.qty) || 0));
    if (qty >= 1) merged.set(String(i.productId), Math.min(99, (merged.get(String(i.productId)) || 0) + qty));
  }
  const profile = await getOrCreateProfile(req.admin._id);
  profile.cart = [...merged.entries()].map(([product, qty]) => ({ product, qty }));
  await profile.save();
  res.json(await serializeCart(profile));
};

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getCart,
  saveCart,
  getOrCreateProfile,
};
