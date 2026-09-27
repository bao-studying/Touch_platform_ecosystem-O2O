# O2O Platform — Admin Server + Admin Web (SaaS Landing Page & Super Admin)

Đây là **Admin Server** (backend) và **Admin Web** (frontend: trang giới thiệu công khai + Super Admin
Dashboard), đã được **gộp chung** vào 1 thư mục cùng với **Client Server**/**Client Web** (chính là app
Touch-app — nơi doanh nghiệp & khách hàng thật sự dùng) để tiện chạy cả 4 project bằng 1 lệnh duy nhất.
Về mặt code, 2 phía vẫn **hoàn toàn tách biệt** (2 package.json riêng, 2 quá trình Node riêng) — chỉ đứng
chung thư mục cho tiện, không hề dùng chung code hay build chung.

## Kiến trúc tổng quan

```
                    ┌─────────────────────┐         ┌──────────────────────┐
                    │   Admin Server       │         │   Client Server       │
                    │   (mới — port 5001)  │         │   (repo Touch-app     │
                    │                       │         │    có sẵn — port 5000)│
                    │  - Super Admin API    │         │  - Tenant API          │
                    │  - Public site API    │         │  - NFC/QR, Landing Page│
                    │  - Socket.IO server   │         │    của từng doanh nghiệp│
                    └──────────┬────────────┘         └──────────┬─────────────┘
                               │                                  │
                               └────────────┬─────────────────────┘
                                             │
                                   1 MongoDB DÙNG CHUNG
                          (ranh giới sở hữu theo collection — xem bên dưới)

    ┌──────────────────────┐                              ┌──────────────────────┐
    │   Admin Web            │                              │   Client Web           │
    │   (mới — port 5174)    │──── link/token khi cần ─────▶│   (repo Touch-app      │
    │  Trang giới thiệu +    │◀─── Socket.IO real-time ─────│    có sẵn — port 5173) │
    │  Super Admin Dashboard │                              │   Admin Dashboard tenant│
    └──────────────────────┘                              └──────────────────────┘
```

**Ranh giới sở hữu dữ liệu** (đọc kỹ trước khi sửa code):
- **Client Server sở hữu**: `Admin` (trừ vài field bên dưới), `Business` (trừ vài field), `NfcTag`, `Link`, `Review`, `Lead` — toàn bộ nghiệp vụ NFC/QR, Landing Page từng doanh nghiệp.
- **Admin Server sở hữu**: `SuperAdmin`, `PlanConfig`, `HardwareProduct`, `Order`, `Ticket`, `CmsContent`, `ContactSubmission`, `PlatformSettings`.
- **Field cấp nền tảng trên collection chung** — chỉ Admin Server ghi, Client Server chỉ đọc: `Admin.pendingPlan/isEmailVerified/isLocked`, `Business.plan/planExpiresAt/planHistory`.
- Admin Server **không import bất kỳ file code nào** của Client Server — nó tự khai báo Mongoose model riêng (xem `admin-server/models/shared/`) trỏ vào đúng collection chung.

## Cấu trúc thư mục

```
o2o-platform/
├── package.json          ← chạy npm run dev ở đây để khởi động TẤT CẢ cùng lúc
├── admin-server/         ← BE Admin Server (Super Admin + API công khai)
├── admin-web/            ← FE Admin Server (trang giới thiệu + Super Admin Dashboard)
├── client-server/        ← BE Touch-app (đã gộp vào — API tenant, NFC/QR, thanh toán...)
└── client-web/           ← FE Touch-app (đã gộp vào — Admin Dashboard tenant + Landing Page)
```

## Cài đặt & chạy

```bash
# 1. Cấu hình .env cho từng project con (copy từ .env.example trong mỗi thư mục)
#    ⚠️ QUAN TRỌNG: MONGO_URI và JWT_SECRET của admin-server PHẢI TRÙNG với client-server

# 2. Cài đặt tất cả
npm install                    # cài concurrently ở gốc
npm run install:all            # cài cho cả 4 project con

# 3. Chạy tất cả cùng lúc
npm run dev
```

Chỉ muốn chạy riêng Admin Server + Admin Web (chưa cần Client): `npm run dev:admin`.

## Port mặc định

| Project | Port | Vai trò |
|---|---|---|
| `client-server` | 5000 | API app khách hàng (Touch-app — có sẵn) |
| `client-web` | 5173 | Admin Dashboard tenant + Landing Page từng doanh nghiệp (Touch-app — có sẵn) |
| `admin-server` | 5001 | API trang giới thiệu + Super Admin + Socket.IO |
| `admin-web` | 5174 | Trang giới thiệu công khai + Super Admin Dashboard |

## Truy cập Super Admin

Không có link công khai nào dẫn tới trang đăng nhập Super Admin. Vào bằng 1 trong 2 cách:
1. Gõ thẳng `http://localhost:5174/super-admin/login`
2. Cơ chế ẩn ("Easter Egg") ở Form Liên hệ (`http://localhost:5174/contact`): điền đúng Email + Số điện
   thoại = Email + Mật khẩu Super Admin → tự chuyển hướng vào Dashboard, không dấu vết trên UI.

Tài khoản Super Admin đầu tiên tự tạo khi `admin-server` khởi động lần đầu, đọc từ
`SUPER_ADMIN_SEED_EMAIL`/`SUPER_ADMIN_SEED_PASSWORD` trong `admin-server/.env`.

## Real-time bằng Socket.IO

Admin Server chạy 1 Socket.IO server (chung port với HTTP API). Admin Web đã kết nối sẵn. Client Web
cũng đã kết nối sẵn (xem `client-web/src/lib/socket.js` + `client-web/src/context/AuthContext.jsx`) —
nhận cùng các sự kiện:
- `plan:updated`, `hardware:updated`, `cms:updated` — phát tới TẤT CẢ (phòng `public`)
- `account:locked`, `order:status`, `ticket:reply` — chỉ phát tới đúng tenant liên quan (phòng `tenant:<id>`)

## Đăng ký tài khoản mới & "Login as User"

Vì Dashboard thật nằm ở Client Web (ứng dụng riêng), khi cần đưa 1 tenant từ Admin Web sang đó, hệ thống
chuyển hướng kèm `?token=<jwt>` — token ký bằng `JWT_SECRET` CHUNG nên Client Web chấp nhận ngay, không
cần đăng nhập lại. Áp dụng cho: đăng ký mới xong (trang `/download`), và Super Admin "Login as User".

## Production sau này

Kiến trúc này giữ nguyên được khi lên production thật — không cần viết lại:
- Vẫn 1 MongoDB chung (tách được sau nếu cần scale độc lập, ranh giới sở hữu đã rõ từ đầu)
- Socket.IO: nếu scale nhiều instance Admin Server thì thêm Redis adapter (chưa cần ở quy mô hiện tại)
- JWT: giữ nguyên chung 1 secret; token impersonation đã có claim `impersonatedBy` sẵn cho audit sau này
