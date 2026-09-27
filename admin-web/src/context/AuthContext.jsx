import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { socket } from "../lib/socket";

// Auth Tenant NGAY TẠI Admin Web (gọi API Admin Server) — dùng cho: Đăng nhập ở trang giới thiệu,
// đặt hàng ở Store, gửi ticket hỗ trợ. Token sinh ra dùng CHUNG được cho Client Server thật (JWT_SECRET
// chung) — khi cần vào Dashboard đầy đủ, ta chuyển hướng sang Client Web kèm ?token= (xem DownloadApp.jsx
// và SuperAdminLayout "Login as User").
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("o2o_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setAdmin(res.data);
        socket.emit("auth:tenant", token); // join phòng riêng để nhận cập nhật real-time (đơn hàng, ticket, khóa TK)
      })
      .catch(() => localStorage.removeItem("o2o_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("o2o_token", res.data.token);
    setAdmin(res.data);
    socket.emit("auth:tenant", res.data.token);
    return res.data;
  };

  const register = async (name, email, password, plan = "free") => {
    const res = await api.post("/auth/register", { name, email, password, plan });
    localStorage.setItem("o2o_token", res.data.token);
    setAdmin(res.data);
    socket.emit("auth:tenant", res.data.token);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("o2o_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
