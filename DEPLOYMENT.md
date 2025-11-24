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
