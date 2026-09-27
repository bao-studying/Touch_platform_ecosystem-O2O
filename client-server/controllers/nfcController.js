const NfcTag = require("../models/NfcTag");
const Business = require("../models/Business");

const assertOwnership = async (businessId, adminId) => {
  const business = await Business.findById(businessId);
  if (!business) return { error: "Không tìm thấy doanh nghiệp", status: 404 };
  if (business.owner.toString() !== adminId.toString()) {
    return { error: "Bạn không có quyền", status: 403 };
  }
  return { business };
};

// @desc  Danh sách chip NFC của 1 business
// @route GET /api/nfc/business/:businessId
const getTagsByBusiness = async (req, res) => {
  const { error, status } = await assertOwnership(req.params.businessId, req.admin._id);
  if (error) return res.status(status).json({ message: error });

  const tags = await NfcTag.find({ business: req.params.businessId }).sort({ createdAt: -1 });
  res.json(tags);
};

// @desc  Bước 1-3 Guided Workflow: đăng ký UID mới (chưa khóa)
// @route POST /api/nfc
// body: { business, uid, itemType, branch }
const registerTag = async (req, res) => {
  const { business: businessId, uid, itemType, branch } = req.body;
  const { error, status } = await assertOwnership(businessId, req.admin._id);
  if (error) return res.status(status).json({ message: error });

  if (!uid) return res.status(400).json({ message: "Vui lòng nhập UID của chip" });

  const existing = await NfcTag.findOne({ uid });
  if (existing) return res.status(400).json({ message: "UID này đã được sử dụng cho chip khác" });

  const tag = await NfcTag.create({
    business: businessId,
    uid,
    itemType: itemType || "gấu bông",
    branch: branch || "",
  });

  res.status(201).json(tag);
};

// @desc  Bước 4 Guided Workflow: xác nhận đã ghi & khóa chip thành công (kèm phương thức: nfc thật hoặc qr demo)
// @route PUT /api/nfc/:id/activate
// body: { activationMethod?: 'nfc' | 'qr' }
const activateTag = async (req, res) => {
  const tag = await NfcTag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Không tìm thấy chip" });

  const { error, status } = await assertOwnership(tag.business, req.admin._id);
  if (error) return res.status(status).json({ message: error });

  tag.locked = true;
  tag.activatedAt = new Date();
  if (req.body.activationMethod) tag.activationMethod = req.body.activationMethod;
  await tag.save();

  res.json(tag);
};

// @desc  Cập nhật ghi chú vị trí đặt thật (dùng trong popup chi tiết chip)
// @route PUT /api/nfc/:id/note
const updatePlacementNote = async (req, res) => {
  const tag = await NfcTag.findById(req.params.id);
  if (!tag) return res.status(404).json({ message: "Không tìm thấy chip" });

  const { error, status } = await assertOwnership(tag.business, req.admin._id);
  if (error) return res.status(status).json({ message: error });

  tag.placementNote = req.body.placementNote || "";
  await tag.save();
  res.json(tag);
};

// @desc  Ghi nhận 1 lượt quét thật từ khách (public, gọi khi Landing Page mở qua ?tag=UID)
// @route POST /api/nfc/scan/:uid
const recordScan = async (req, res) => {
  const tag = await NfcTag.findOne({ uid: req.params.uid });
  if (!tag) return res.status(404).json({ message: "Không tìm thấy chip" });
  tag.scanCount += 1;
  await tag.save();
  res.json({ ok: true });
};

module.exports = { getTagsByBusiness, registerTag, activateTag, updatePlacementNote, recordScan };
