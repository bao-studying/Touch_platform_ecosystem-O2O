# Tích hợp Client Web (repo Touch-app) với Admin Server mới

File này liệt kê CHÍNH XÁC những gì cần thêm vào repo `Touch-app` hiện có của bạn để kết nối với
Admin Server mới — không đụng tới bất kỳ logic nghiệp vụ nào đã có, chỉ thêm.

Tổng cộng: **2 file mới** (copy nguyên) + **3 chỗ sửa nhỏ** trong file có sẵn.

---

## Bước 0 — Thêm biến môi trường

Thêm vào `frontend/.env` (cạnh `VITE_API_URL` đã có):

```
VITE_ADMIN_SERVER_URL=http://localhost:5001
```

---

## Bước 1 — Copy 2 file mới vào `frontend/src/lib/`

Tạo thư mục `frontend/src/lib/` nếu chưa có, rồi copy nguyên 2 file trong folder `client-integration/` này vào:

- `socket.js` → `frontend/src/lib/socket.js`
- `adminServerAxios.js` → `frontend/src/lib/adminServerAxios.js`

---

## Bước 2 — `frontend/src/context/AuthContext.jsx`: nhận token từ Admin Server

Khi tenant đăng ký/đăng nhập bên trang giới thiệu (Admin Web) rồi được chuyển hướng sang đây, hoặc khi
Super Admin dùng "Login as User", URL sẽ có dạng `.../admin?token=xxx`. Thêm đoạn nhận token này, và join
phòng Socket.IO riêng để nhận cập nhật real-time (tài khoản bị khóa, đơn hàng, ticket được trả lời).

**Tìm đoạn `useEffect` đọc token hiện tại** (đầu file, trong `AuthProvider`):

```jsx
useEffect(() => {
  const token = localStorage.getItem("o2o_token");
  if (!token) {
    setLoading(false);
    return;
  }
  api
    .get("/auth/me")
    .then((res) => setAdmin(res.data))
    .catch(() => localStorage.removeItem("o2o_token"))
    .finally(() => setLoading(false));
}, []);
```

**Thay bằng:**

```jsx
import { adminServerSocket } from "../lib/socket"; // thêm import này lên đầu file

useEffect(() => {
  // Token từ Admin Server gửi sang (đăng ký mới, hoặc Super Admin "Login as User")
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
      adminServerSocket.emit("auth:tenant", token); // nhận cập nhật real-time riêng cho tài khoản này
    })
    .catch(() => localStorage.removeItem("o2o_token"))
    .finally(() => setLoading(false));
}, []);
```

**Trong hàm `login`**, thêm 1 dòng sau khi lưu token:

```jsx
const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  localStorage.setItem("o2o_token", res.data.token);
  setAdmin(res.data);
  adminServerSocket.emit("auth:tenant", res.data.token); // ← thêm dòng này
  return res.data;
};
```

> Vì token ký bằng cùng `JWT_SECRET` với Admin Server nên bước xác thực `/auth/me` ở trên vẫn chạy
> đúng như cũ, không cần sửa gì backend.

---

## Bước 3 — `frontend/src/pages/admin/Store.jsx`: lấy giá động từ Admin Server

Hiện tại file này có mảng `PLANS` viết cứng. Super Admin giờ quản lý giá ở Admin Server, nên đổi sang đọc
động — Super Admin sửa giá ở đâu thì trang này tự cập nhật ngay (kể cả không tải lại trang, nhờ Socket.IO).

**Thay phần đầu file:**

```jsx
import { useState } from "react";
import { Check, X, Package, Wrench } from "lucide-react";
import api from "../../api/axios";
import { useBusiness } from "../../context/BusinessContext";
import UnlockToast from "../../components/admin/UnlockToast";

const PLANS = [
  { id: "free", name: "Free", price: "0đ", desc: "...", features: [...] },
  // ...
];
```

**thành:**

```jsx
import { useEffect, useState } from "react";
import { Check, X, Package, Wrench } from "lucide-react";
import api from "../../api/axios";
import adminServerApi from "../../lib/adminServerAxios";
import { adminServerSocket } from "../../lib/socket";
import { useBusiness } from "../../context/BusinessContext";
import UnlockToast from "../../components/admin/UnlockToast";
```

**Trong component `Store()`, thêm state + effect để tải gói (thay cho hằng số `PLANS` cũ):**

```jsx
export default function Store() {
  const { business, updateBusinessLocal } = useBusiness();
  const [plans, setPlans] = useState([]);
  // ...state khác giữ nguyên

  useEffect(() => {
    const loadPlans = () => adminServerApi.get("/public/plans").then((res) => setPlans(res.data)).catch(() => {});
    loadPlans();
    adminServerSocket.on("plan:updated", loadPlans);
    return () => adminServerSocket.off("plan:updated", loadPlans);
  }, []);
```

**Trong JSX**, mọi chỗ đang dùng `PLANS.map(...)` đổi thành `plans.map(...)`, và field đổi tên:
`plan.id` → `plan.planKey`, `plan.price` → `plan.priceVnd === 0 ? "0đ" : plan.priceLabel`,
`plan.desc` → `plan.tagline`. `plan.features` giữ nguyên tên, dùng y như cũ.

---

## (Tùy chọn) Hiển thị thông báo real-time trong Dashboard

Nếu muốn hiện banner/toast ngay khi tài khoản bị khóa hoặc có cập nhật đơn hàng/ticket, lắng nghe thêm ở
`AdminLayout.jsx` hoặc trang bất kỳ:

```jsx
import { adminServerSocket } from "../../lib/socket";

useEffect(() => {
  const onLocked = (data) => { if (data.isLocked) alert("Tài khoản của bạn đã bị tạm khóa."); };
  const onOrder = (data) => console.log("Cập nhật đơn hàng:", data);
  const onTicket = (data) => console.log("Ticket có phản hồi mới:", data);
  adminServerSocket.on("account:locked", onLocked);
  adminServerSocket.on("order:status", onOrder);
  adminServerSocket.on("ticket:reply", onTicket);
  return () => {
    adminServerSocket.off("account:locked", onLocked);
    adminServerSocket.off("order:status", onOrder);
    adminServerSocket.off("ticket:reply", onTicket);
  };
}, []);
```

Phần này không bắt buộc — bỏ qua vẫn không ảnh hưởng gì đến các bước 1–3 ở trên.

---

## Checklist nhanh

- [ ] Thêm `VITE_ADMIN_SERVER_URL` vào `.env`
- [ ] Copy `socket.js` + `adminServerAxios.js` vào `frontend/src/lib/`
- [ ] Sửa `AuthContext.jsx`: nhận `?token=`, emit `auth:tenant`
- [ ] Sửa `Store.jsx`: đọc giá động từ Admin Server
- [ ] Cài `socket.io-client` vào `frontend/package.json`: `npm install socket.io-client`
