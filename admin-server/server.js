require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { initSockets } = require("./sockets");
const seedPlatformDefaults = require("./utils/seedPlatformDefaults");

connectDB().then(() => seedPlatformDefaults());

const app = express();

const allowedOrigins = [process.env.CLIENT_WEB_URL, process.env.ADMIN_WEB_URL].filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "O2O Admin Server đang chạy 🚀 (SaaS Landing Page API + Super Admin API)" });
});

// ---- Tenant (đăng ký/đăng nhập trên trang giới thiệu, đặt hàng, gửi ticket) ----
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/customer", require("./routes/customerRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));

// ---- Công khai (không cần đăng nhập) ----
app.use("/api/public", require("./routes/publicSiteRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes")); // webhook SePay

// ---- Super Admin ----
app.use("/api/super-admin", require("./routes/superAdminRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: `Không tìm thấy route: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Lỗi máy chủ" });
});

const PORT = process.env.PORT || 5001;
const httpServer = http.createServer(app);
initSockets(httpServer);
httpServer.listen(PORT, () => console.log(`[Admin Server] Đang chạy tại http://localhost:${PORT}`));
