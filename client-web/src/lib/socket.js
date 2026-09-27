import { io } from "socket.io-client";

// Kết nối Socket.IO tới ADMIN SERVER (không phải server của chính app này) — để nhận cập nhật
// real-time khi Super Admin đổi giá gói / sản phẩm hardware / khóa tài khoản / trả lời ticket...
// Cần biến VITE_ADMIN_SERVER_URL trong frontend/.env — xem client-integration/INTEGRATION_GUIDE.md.
export const adminServerSocket = io(import.meta.env.VITE_ADMIN_SERVER_URL || "http://localhost:5001", {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
