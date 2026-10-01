import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import superAdminApi from "../api/superAdminAxios";
import { socket } from "../lib/socket";

// Dữ liệu cho chuông thông báo. `scope`:
//  • "tenant"     — thông báo của khách đang đăng nhập (token o2o_token)
//  • "superadmin" — thông báo vận hành của Super Admin (token o2o_superadmin_token)
// Cập nhật realtime qua Socket.IO ("notification:new"); có fallback tải lại khi quay lại tab để không bao giờ lệch số đếm.
const CONFIG = {
  tenant: { client: api, base: "/notifications", tokenKey: "o2o_token", authEvent: "auth:tenant" },
  superadmin: { client: superAdminApi, base: "/super-admin/notifications", tokenKey: "o2o_superadmin_token", authEvent: "auth:superadmin" },
};

export function useNotifications(scope) {
  const { client, base, tokenKey, authEvent } = CONFIG[scope];
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0); // tăng mỗi lần có thông báo mới → chuông lắc
  const itemsRef = useRef([]);
  itemsRef.current = items;

  const load = useCallback(
    () =>
      client
        .get(base)
        .then((res) => {
          setItems(res.data.items);
          setUnread(res.data.unreadCount);
        })
        .catch(() => {})
        .finally(() => setLoading(false)),
    [client, base]
  );

  useEffect(() => {
    load();

    // Vào phòng riêng để nhận thông báo realtime. Gửi lại mỗi lần (tái) kết nối vì server quên phòng khi socket rớt.
    const join = () => {
      const token = localStorage.getItem(tokenKey);
      if (token) socket.emit(authEvent, token);
    };
    const onConnect = () => {
      join();
      load(); // có thể đã lỡ thông báo trong lúc mất kết nối
    };
    const onNew = (n) => {
      if (itemsRef.current.some((x) => x._id === n._id)) return; // đã có (vd vừa tải danh sách xong) → không đếm 2 lần
      setItems((prev) => [n, ...prev].slice(0, 50));
      setUnread((u) => u + 1);
      setPulse((p) => p + 1);
    };
    const onFocus = () => {
      if (document.visibilityState === "visible") load();
    };

    join();
    socket.on("connect", onConnect);
    socket.on("notification:new", onNew);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      socket.off("connect", onConnect);
      socket.off("notification:new", onNew);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load, tokenKey, authEvent]);

  // Cập nhật lạc quan (giao diện đổi ngay), lỗi mạng thì tải lại từ server cho đúng.
  const markRead = useCallback(
    (id) => {
      const target = itemsRef.current.find((n) => n._id === id);
      if (!target || target.read) return;
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
      client.put(`${base}/${id}/read`).catch(load);
    },
    [client, base, load]
  );

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    client.put(`${base}/read-all`).catch(load);
  }, [client, base, load]);

  return { items, unread, loading, pulse, markRead, markAllRead, reload: load };
}
