require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");

connectDB();

const app = express();

// Bộ header bảo mật chuẩn (chống clickjacking, MIME sniffing, v.v.).
// - contentSecurityPolicy: false vì đây là API thuần JSON, không render HTML nên CSP mặc định
//   của helmet (nhắm tới trang web) không cần thiết và có thể gây nhiễu.
// - crossOriginResourcePolicy: "cross-origin" để ảnh tĩnh ở /uploads (logo/cover/mascot) vẫn
//   load được từ domain khác (frontend deploy riêng domain với backend).
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  })
);
// Giới hạn kích thước body JSON — chặn request payload khổng lồ làm nghẽn/tràn bộ nhớ server.
app.use(express.json({ limit: "1mb" }));

// Phục vụ ảnh đã upload (logo/cover/mascot) — lưu local cho demo, xem ghi chú trong uploadController.js
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "O2O Brand Promotion API đang chạy 🚀" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/business", require("./routes/businessRoutes"));
app.use("/api/links", require("./routes/linkRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/leads", require("./routes/leadRoutes"));
app.use("/api/nfc", require("./routes/nfcRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Không tìm thấy route: ${req.originalUrl}` });
});

// Error handler chung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Lỗi máy chủ" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));
