const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// Socket.IO chạy NGAY TẠI Admin Server (chung port với HTTP). Client Web (app khách hàng) và Admin Web
// (trang giới thiệu + Super Admin) đều là CLIENT của socket này — không cần chạy thêm server nào khác.
//
// 3 phòng (room):
// - "public": mọi kết nối đều tự vào — phát các thay đổi công khai (giá gói, nội dung CMS, sản phẩm hardware)
//   để trang giới thiệu VÀ Store trong Admin Dashboard của Client Server cùng cập nhật ngay không cần load lại.
// - "tenant:<adminId>": chỉ tenant đã xác thực mới vào được — phát các thay đổi riêng của họ
//   (tài khoản bị khóa, trạng thái đơn hàng, có người trả lời ticket...).
// - "superadmin": chỉ Super Admin đã xác thực (event "auth:superadmin") — thông báo vận hành (đơn mới, tiền về...).
let io = null;

function initSockets(httpServer) {
  const allowedOrigins = [process.env.CLIENT_WEB_URL, process.env.ADMIN_WEB_URL].filter(Boolean);

  io = new Server(httpServer, {
    cors: { origin: allowedOrigins.length ? allowedOrigins : "*", credentials: true },
  });

  io.on("connection", (socket) => {
    socket.join("public");

    // Client Web / Admin Web gửi token tenant lên (sau khi đăng nhập) để nhận cập nhật cá nhân hoá.
    socket.on("auth:tenant", (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.join(`tenant:${decoded.id}`);
      } catch (err) {
        // Token không hợp lệ/hết hạn — bỏ qua, không join phòng riêng nào.
      }
    });

    // Super Admin gửi token riêng (SUPER_ADMIN_JWT_SECRET) để vào phòng "superadmin" — nhận thông báo đơn mới, tiền về, ticket...
    // Bắt buộc kiểm tra role: token tenant không bao giờ được vào phòng này.
    socket.on("auth:superadmin", (token) => {
      try {
        const decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET);
        if (decoded.role === "superadmin") socket.join("superadmin");
      } catch (err) {
        // Token không hợp lệ/hết hạn — bỏ qua.
      }
    });

    socket.on("disconnect", () => {});
  });

  console.log("[Admin Server] Socket.IO đã sẵn sàng");
  return io;
}

const emitPublic = (event, payload) => {
  if (io) io.to("public").emit(event, payload);
};

const emitToTenant = (tenantId, event, payload) => {
  if (io) io.to(`tenant:${tenantId}`).emit(event, payload);
};

const emitToSuperAdmins = (event, payload) => {
  if (io) io.to("superadmin").emit(event, payload);
};

module.exports = { initSockets, emitPublic, emitToTenant, emitToSuperAdmins };
