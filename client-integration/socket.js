import { io } from "socket.io-client";

// Kết nối Socket.IO tới ADMIN SERVER (không phải server của chính app này) — để nhận cập nhật real-time
// khi Super Admin đổi giá gói / nội dung CMS / khóa tài khoản / cập nhật đơn hàng, ticket...
// Cần thêm biến VITE_ADMIN_SERVER_URL vào file .env của frontend (xem INTEGRATION_GUIDE.md).
export const adminServerSocket = io(import.meta.env.VITE_ADMIN_SERVER_URL || "http://localhost:5001", {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
