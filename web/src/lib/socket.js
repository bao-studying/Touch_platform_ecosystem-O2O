import { io } from "socket.io-client";

// 1 kết nối Socket.IO dùng chung cho cả app — tới Admin Server (không phải Client Server).
// Phòng "public" tự động join khi kết nối (phát giá gói/nội dung CMS/sản phẩm hardware thay đổi).
// Phòng "tenant:<id>" cần gọi socket.emit("auth:tenant", token) sau khi đăng nhập — xem AuthContext.jsx.
export const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5001", {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
