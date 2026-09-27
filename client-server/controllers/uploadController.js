const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Chỉ chấp nhận file ảnh (PNG/JPEG/WEBP/GIF/SVG)"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// @desc  Upload 1 ảnh (logo/cover/mascot) — TODO: chuyển sang Cloudinary/S3 khi triển khai thật,
//        lưu local chỉ phù hợp demo vì hosting dạng ổ đĩa tạm sẽ mất ảnh khi restart.
// @route POST /api/uploads
const uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Không có file nào được tải lên" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
};

module.exports = { upload, uploadImage };
