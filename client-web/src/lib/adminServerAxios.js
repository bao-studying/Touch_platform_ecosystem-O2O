import axios from "axios";

// Axios instance RIÊNG, trỏ sang ADMIN SERVER — dùng để đọc dữ liệu công khai do Super Admin quản lý
// (giá gói, sản phẩm hardware...) và gọi các API cần đăng nhập của Admin Server (VD: gửi/xem "Báo cáo
// sự cố"). KHÔNG dùng instance này để gọi API của chính app này (giữ nguyên api/axios.js cho việc đó).
const adminServerApi = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_SERVER_URL
    ? `${import.meta.env.VITE_ADMIN_SERVER_URL}/api`
    : "http://localhost:5001/api",
});

// Admin Server dùng CHUNG JWT_SECRET với Client Server, nên token đăng nhập ở đây (o2o_token) xác
// thực được luôn ở Admin Server (middleware protectTenant) — không cần đăng nhập lần 2.
adminServerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("o2o_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default adminServerApi;
