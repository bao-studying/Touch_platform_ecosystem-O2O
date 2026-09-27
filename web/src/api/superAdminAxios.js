import axios from "axios";

// Instance axios RIÊNG cho khu vực Super Admin — dùng key localStorage khác (o2o_superadmin_token) để
// không bao giờ lẫn với token đăng nhập của Tenant (o2o_token), kể cả khi mở 2 tab cùng lúc.
const superAdminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

superAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("o2o_superadmin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default superAdminApi;
