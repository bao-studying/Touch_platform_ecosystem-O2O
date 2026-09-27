const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// Socket.IO chạy NGAY TẠI Admin Server (chung port với HTTP). Client Web (app khách hàng) và Admin Web
// (trang giới thiệu + Super Admin) đều là CLIENT của socket này — không cần chạy thêm server nào khác.
//
// 2 phòng (room):
// - "public": mọi kết nối đều tự vào — phát các thay đổi công khai (giá gói, nội dung CMS, sản phẩm hardware)
//   để trang giới thiệu VÀ Store trong Admin Dashboard của Client Server cùng cập nhật ngay không cần load lại.
// - "tenant:<adminId>": chỉ tenant đã xác thực mới vào được — phát các thay đổi riêng của họ
//   (tài khoản bị khóa, trạng thái đơn hàng, có người trả lời ticket...).
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

module.exports = { initSockets, emitPublic, emitToTenant };
