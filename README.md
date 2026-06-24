# UI Showcase
![UI Showcase](./github/Example-UI.png)

# Hướng dẫn Triển khai (Deployment Guide)

Tài liệu này liệt kê các cấu hình cần thiết để triển khai ứng dụng Family Tree lên server.

## 1. Backend (NestJS)

### Cấu hình Environment Variables

Tạo file `.env` trong thư mục `backend/` dựa trên file `.env.example`.

| Biến                          | Mô tả                                      | Ví dụ                                                               |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `PORT`                        | Port mà backend sẽ chạy                    | `9999`                                                              |
| `MONGODB_URI`                 | Chuỗi kết nối MongoDB                      | `mongodb://root:123456@localhost:27017/familytree?authSource=admin` |
| `JWT_SECRET_KEY`              | Khóa bí mật để mã hóa token                | `chuoi_ngau_nhien_bao_mat`                                          |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Thời gian hết hạn token                    | `7d`                                                                |
| `CLOUDINARY_CLOUD_NAME`       | Tên Cloudinary (lưu ảnh)                   | `my-cloud-name`                                                     |
| `CLOUDINARY_API_KEY`          | API Key Cloudinary                         | `123456789`                                                         |
| `CLOUDINARY_API_SECRET`       | API Secret Cloudinary                      | `abcdef123456`                                                      |
| `ADMIN_PASSWORD`              | Mật khẩu cho tài khoản Admin (user: admin) | `MatKhauAdminSieuManh`                                              |
| `TELEGRAM_BOT_TOKEN`          | Token bot Telegram (lấy qua @BotFather)    | `123456:ABC-DEF...`                                                 |
| `TELEGRAM_CHAT_ID`            | Chat ID của group nhận thông báo sự kiện   | `-1001234567890`                                                   |
| `CRON_SECRET`                 | Chuỗi bí mật bảo vệ endpoint cron          | `chuoi_bi_mat_cron_ngau_nhien`                                      |

> Ba biến `TELEGRAM_*` và `CRON_SECRET` chỉ cần khi dùng tính năng **Hệ thống Sự kiện & Thông báo Telegram** (xem mục 5). Thiếu các biến Telegram thì backend vẫn chạy bình thường, chỉ bỏ qua việc gửi tin nhắn.

### Lưu ý khi Deploy

-   Nếu dùng Docker Compose cho cả App và DB, `MONGODB_URI` nên trỏ tới tên service (ví dụ: `mongodb://root:123456@mongodb:27017/...`).
-   `CORS` hiện tại đang để `origin: '*'`. Trong môi trường production, nên đổi lại thành domain của frontend để bảo mật hơn (sửa trong `backend/src/main.ts`).

## 2. Frontend (Next.js)

### Cấu hình Environment Variables

Tạo file `.env.local` (hoặc set biến môi trường trên server) trong thư mục `frontend/`.

| Biến                  | Mô tả                     | Ví dụ                                                               |
| --------------------- | ------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Đường dẫn tới API Backend | `http://your-domain.com/api/v1` hoặc `http://IP-Server:9999/api/v1` |

### Lưu ý khi Build

-   Frontend cần biết `NEXT_PUBLIC_API_URL` **tại thời điểm build** (nếu là Static Site Generation) hoặc Runtime (nếu là Client-side fetching).
-   Trong dự án này, chúng ta dùng Client-side fetching (`axios` trong `src/services`), nên biến này sẽ được trình duyệt đọc. Đảm bảo URL này public (người dùng truy cập được).

## 3. Các bước Deploy cơ bản

1. **Database**: Chạy MongoDB (có thể dùng Docker Compose trong `backend/docker-compose.yml`).
2. **Backend**:
    - `cd backend`
    - `npm install`
    - `npm run build`
    - `npm run start:prod`
3. **Frontend**:
    - `cd frontend`
    - `npm install`
    - Cập nhật `.env.local` với IP/Domain của Backend.
    - `npm run build`
    - `npm start` (chạy Next.js server) hoặc export ra static file nếu cần.

## 4. Docker (Tùy chọn)

Nếu bạn muốn đóng gói cả ứng dụng, bạn có thể viết thêm `Dockerfile` cho Backend và Frontend.

## 5. Hệ thống Sự kiện (Event System) & Thông báo Telegram

Tính năng quản lý các sự kiện lặp lại hằng năm của dòng họ: **giỗ**, **sinh nhật**, và **lễ/sự kiện tùy chỉnh**.

### Tính năng

-   **Bảng `events` (MongoDB)** — collection mới, không ảnh hưởng dữ liệu `Person/Spouse/ParentChild` cũ.
-   **Tự động đồng bộ từ Person**: khi thêm/sửa **ngày mất** → tự tạo/cập nhật event **Giỗ** (theo **âm lịch**); khi thêm/sửa **ngày sinh** → event **Sinh nhật** (theo **dương lịch**). Xóa người → xóa các event tự động liên quan.
-   **Sự kiện thủ công**: admin/editor có thể thêm lễ gia đình, giỗ của người không có trong gia phả… và **chọn âm hoặc dương lịch**.
-   **Trang `/events`** (chỉ người đã đăng nhập): danh sách sắp xếp theo ngày gần nhất, lọc theo loại, thêm/xóa, bật/tắt thông báo từng sự kiện, và nút **"Tính lại giỗ & sinh nhật"** (admin) để sinh/đồng bộ lại auto-event cho toàn bộ thành viên hiện có.
-   **Chuông thông báo** trên TopBar đọc trực tiếp từ bảng event.
-   **5 mốc nhắc** dùng chung cho cả chuông và Telegram: trước **1 tháng**, trước **1 tuần**, **đầu tuần** chứa sự kiện, **đầu tháng** chứa sự kiện, và **đúng ngày**.
-   **Bot Telegram**: mỗi sáng gửi 1 digest gộp các sự kiện tới mốc nhắc (tự tách tin nếu quá dài).

### Cài đặt Bot Telegram

1. Nhắn **@BotFather** trên Telegram → `/newbot` → lấy `TELEGRAM_BOT_TOKEN`.
2. Thêm bot vào group dòng họ, lấy `TELEGRAM_CHAT_ID` của group (ví dụ qua `@RawDataBot` hoặc API `getUpdates`).
3. Đặt `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `CRON_SECRET` vào biến môi trường backend (mục 1).

### Vercel Cron (gửi thông báo hằng ngày)

-   `backend/vercel.json` đã khai báo cron gọi `GET /api/v1/event/cron/daily-notify` lúc `0 0 * * *` (00:00 UTC ≈ **7h sáng giờ VN**).
-   Vercel tự gắn header `Authorization: Bearer <CRON_SECRET>` khi gọi; endpoint từ chối nếu sai secret. Endpoint này **không** yêu cầu đăng nhập JWT.
-   **Vercel Hobby (free)**: cron chạy tối đa **1 lần/ngày** — đủ cho 1 lần gửi digest mỗi sáng.

### Lần đầu chạy với dữ liệu cũ

Người đã có sẵn (ngày sinh/mất) chưa có event. Sau khi deploy, đăng nhập **admin** → vào `/events` → bấm **"Tính lại giỗ & sinh nhật"** một lần để sinh toàn bộ auto-event (hoặc gọi `POST /api/v1/event/sync-all`).

### Các API chính (`/api/v1/event`)

| Method & Path                | Quyền             | Mô tả                                            |
| ---------------------------- | ----------------- | ------------------------------------------------ |
| `GET /event`                 | JWT (mọi role)    | Danh sách event, sort theo ngày sắp tới          |
| `GET /event/notifications`   | JWT               | Event đang tới mốc nhắc hôm nay (cho chuông FE)   |
| `POST /event`                | admin, editor     | Tạo sự kiện thủ công                              |
| `PATCH /event/:id`           | admin, editor     | Sửa (auto-event chỉ cho sửa `desc`/`isActive`)   |
| `DELETE /event/:id`          | admin, editor     | Xóa sự kiện                                       |
| `POST /event/sync-all`       | admin             | Tính lại auto-event từ persons + dọn orphan      |
| `GET /event/cron/daily-notify` | CRON_SECRET     | Vercel Cron gọi → gửi digest Telegram            |
