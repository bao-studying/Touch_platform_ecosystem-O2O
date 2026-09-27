import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { adminServerSocket } from "../lib/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Token từ Admin Server gửi sang qua URL (?token=...) — trường hợp tenant đăng ký/đăng nhập ở
    // trang giới thiệu (Admin Web) rồi được chuyển hướng sang đây, hoặc Super Admin dùng "Đăng nhập
    // với tư cách người dùng này". Lưu lại rồi xóa khỏi URL ngay để không lộ token trên thanh địa chỉ.
    const params = new URLSearchParams(window.location.search);
    const incomingToken = params.get("token");
    if (incomingToken) {
      localStorage.setItem("o2o_token", incomingToken);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const token = localStorage.getItem("o2o_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setAdmin(res.data);
        // Tham gia phòng riêng của tài khoản này trên Admin Server để nhận cập nhật real-time
        // (tài khoản bị khóa, đơn hàng, ticket được trả lời...).
        adminServerSocket.emit("auth:tenant", token);
      })
      .catch(() => localStorage.removeItem("o2o_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("o2o_token", res.data.token);
    setAdmin(res.data);
    adminServerSocket.emit("auth:tenant", res.data.token);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("o2o_token", res.data.token);
    setAdmin(res.data);
    adminServerSocket.emit("auth:tenant", res.data.token);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("o2o_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
