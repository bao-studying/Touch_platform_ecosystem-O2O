import axios from "axios";

// Axios instance RIÊNG, trỏ sang ADMIN SERVER — dùng để đọc dữ liệu công khai do Super Admin quản lý
// (giá gói, sản phẩm hardware, nội dung CMS...). KHÔNG dùng instance này để gọi API của chính app này
// (giữ nguyên api/axios.js hiện có cho việc đó).
const adminServerApi = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_SERVER_URL ? `${import.meta.env.VITE_ADMIN_SERVER_URL}/api` : "http://localhost:5001/api",
});

export default adminServerApi;
