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

## Tài khoản khách, giỏ hàng & đặt hàng (trang công khai)

- **Đăng nhập** ở `/login` dùng chung cho 2 vai trò: tài khoản **Super Admin** → `/super-admin/dashboard`; tài khoản **khách** (chủ doanh nghiệp) → `/account` (hoặc trang họ đang định quay lại qua `?redirect=`). Dashboard chỉ dành cho Super Admin.
- **`/account`** (yêu cầu đăng nhập): tab Hồ sơ · Địa chỉ · Giỏ hàng · Đơn hàng · Bảo mật. Đơn hàng cập nhật realtime khi Super Admin đổi trạng thái.
- **`/cart`**: ai cũng xem/sửa giỏ được. Khách vãng lai lưu giỏ ở localStorage; đăng nhập xong giỏ được gộp vào giỏ trên server (collection `CustomerProfile`) nên dùng được ở thiết bị khác.
- Nút **Tải app** ở navbar trỏ tới Client Web — đặt `VITE_CLIENT_WEB_URL` trong `admin-web/.env`.
- Thông tin ở trang **Liên hệ** (email, hotline, giờ làm việc, mạng xã hội) là **dữ liệu demo** trong `admin-web/src/lib/contactInfo.js` — thay bằng thông tin thật.

API mới (đều qua `protectTenant`): `GET/PUT /api/customer/profile`, `POST/PUT/DELETE /api/customer/addresses[/:id]`, `GET/PUT /api/customer/cart`, `PUT /api/auth/password`. `POST /api/orders` nay **bắt buộc có địa chỉ giao hàng** (`addressId` hoặc `shipping`).

## Thanh toán COD / chuyển khoản online (SePay) — dùng chung với Client Web

Khi đặt hàng, khách chọn **Thanh toán khi nhận hàng (COD)** hoặc **Chuyển khoản online (QR)**.

**Không cần cấu hình webhook SePay mới.** Webhook hiện có của bạn (link ngrok/domain → `POST /api/payments/webhook/sepay` của Client Server) dùng cho cả hai loại thanh toán:

| Loại | Mã nội dung chuyển khoản | Ai xử lý |
|---|---|---|
| Nâng cấp gói (Client Web) | `O2O<mã DN><GÓI><4 ký tự>` | Client Server (logic cũ, giữ nguyên) |
| Vật phẩm decor (Admin Web) | `O2OHW` + 8 ký tự | Client Server **tự chuyển tiếp** sang Admin Server (`POST /api/payments/internal/sepay`, xác thực bằng JWT ngắn hạn ký bằng `JWT_SECRET` dùng chung) |

- **Tài khoản nhận tiền và mã QR dùng chung**: Admin Server tự đọc `SEPAY_BANK_ID / SEPAY_ACCOUNT_NO / SEPAY_ACCOUNT_NAME` từ Client Server (`GET /api/payments/bank-info`, qua `CLIENT_SERVER_URL`) nên chỉ cấu hình một lần ở `client-server/.env`. QR cùng định dạng VietQR (`img.vietqr.io`) như modal nâng cấp gói. Super Admin → Cài đặt hệ thống hiển thị tài khoản/QR này (chỉ đọc).
- **Điều kiện để chạy**: Client Server và Admin Server cùng chạy; `ADMIN_SERVER_URL` (client-server) và `CLIENT_SERVER_URL` (admin-server) đúng; hai server **dùng chung `JWT_SECRET`** (đã là yêu cầu sẵn có).
- Đơn chuyển khoản có QR hiệu lực 15 phút (đếm ngược, khách "Làm mới mã" được). **Quá hạn mà khách đã chuyển khoản thì vẫn được ghi nhận** (không mất tiền khách). Màn hình thanh toán tự cập nhật (Socket.IO + hỏi lại mỗi 3 giây).
- Chuyển thiếu → trạng thái "một phần", QR chỉ đòi phần còn lại; chuyển trùng / đơn đã hủy / mã không có đơn → báo Super Admin đối soát tay. Mọi giao dịch lưu ở collection `paymenttransactions` (chống xử lý trùng theo id SePay; giao dịch dở dang được xử lý nốt khi SePay gọi lại). Super Admin vẫn xác nhận tay được ở trang Đơn hàng.
- **COD**: sau khi giao, Super Admin bấm "Xác nhận đã thu tiền COD".
- **Chưa cấu hình tài khoản (chỉ môi trường dev)**: khách vẫn đặt chuyển khoản được nhưng thay QR là nút "Giả lập thanh toán" (giống Client Web). Khi `NODE_ENV=production` mà chưa có tài khoản thì ẩn lựa chọn chuyển khoản.
- ⚠️ **Đặt `SEPAY_WEBHOOK_TOKEN`** (client-server/.env) trùng với API Key khai báo ở webhook SePay. Để trống thì ai biết URL ngrok cũng gửi được thanh toán giả (server in cảnh báo khi khởi động). Endpoint giả lập `simulate-success` của Client Server nay bị chặn (403) khi đã cấu hình SePay thật.

## Chuông thông báo

Header của trang công khai (khách đã đăng nhập) và Super Admin đều có chuông + bộ đếm chưa đọc, trên cả mobile lẫn desktop, cập nhật realtime qua Socket.IO (`notification:new`). Khách nhận: tạo đơn, đổi trạng thái đơn, thanh toán thành công/thiếu tiền, phản hồi hỗ trợ. Super Admin nhận: đơn mới, tiền về/không khớp/đơn hủy có tiền, ticket mới, liên hệ mới, khách đăng ký. API: `GET /api/notifications`, `PUT /api/notifications/read-all`, `PUT /api/notifications/:id/read` (khách) và `/api/super-admin/notifications` (tương tự). Thông báo tự xóa sau 90 ngày.

## Giao diện mobile (trang công khai)

Menu hamburger được thay bằng **thanh điều hướng nổi ở đáy màn hình** (Trang chủ · Giới thiệu · Cửa hàng · Liên hệ · Tải app). Header luôn có **chuông · giỏ hàng · avatar tròn** cạnh nhau; chạm avatar vào thẳng trang Tài khoản. Sản phẩm ở Cửa hàng và Giỏ hàng hiển thị dạng lưới thẻ gọn, 3 thẻ mỗi hàng. Biến CSS `--bottom-nav-h` là chiều cao vùng thanh dưới — phần tử ghim/nổi mới nên dùng biến này để không bị che.

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
