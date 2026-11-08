# Kiểm chứng đồ án — 06/11/2026

## Phạm vi nhắc nhở

GET /reminders trả task của người dùng hiện tại có hạn trong 24 giờ tới hoặc đã quá hạn, trừ DONE và ARCHIVED. Giao diện cập nhật mỗi 60 giây và sau thao tác sửa/xóa task. Đây là nhắc hạn trong ứng dụng, không phải gửi email hay hệ thống đặt lịch nhắc riêng. Model Reminder trong Prisma được giữ để tương thích schema hiện có; chưa dùng trong luồng này.

## Cấu hình chạy local

Khởi động Docker Desktop, chạy docker compose up -d db trong backend. PostgreSQL được mở trên localhost:5433; DATABASE_URL trong backend/.env phải dùng đúng cổng. CI có PostgreSQL riêng trên 5432. Không commit .env.

## Bằng chứng kiểm thử

- Backend build và lint: đạt.
- Vitest: 8 test đạt; tách khỏi test Jest.
- Jest: 6 test đạt.
- E2E với PostgreSQL thật: 20 test đạt, gồm xác thực, DTO, phân trang/lọc, CRUD, quyền sở hữu khi đọc/sửa/xóa và gắn quan hệ, lỗi 400/401/404/409/500, Swagger, nhắc hạn, request ID và thời gian xử lý.
- Frontend build và kiểm tra TypeScript: đạt.
- Trình duyệt Edge headless: đăng nhập, thống kê 10 task qua nhiều trang, tạo/đổi tên danh mục và nhãn, tạo/sửa task, xóa deadline/danh mục, gắn nhãn và cập nhật trạng thái đều đạt; không có lỗi JavaScript trên trang.

Các test tạo người dùng riêng với hậu tố duy nhất và xóa dữ liệu của các tài khoản này sau khi chạy.

## Đối chiếu 15 tiêu chí

| Mục | Bằng chứng |
| --- | --- |
| 1–4 | AppModule, các module tính năng, controller, service và constructor injection; build thành công |
| 5 | Global ValidationPipe, DTO, ParseUUIDPipe, giới hạn phân trang; E2E trả 400 |
| 6 | JWT guard, bcrypt, đăng ký/đăng nhập/me; E2E xác thực và 401 |
| 7 | Lọc userId và kiểm tra ownership quan hệ; E2E ngăn truy cập/sửa/xóa chéo người dùng |
| 8 | Prisma + PostgreSQL và migration; E2E dùng database thật |
| 9 | Lọc trạng thái/ưu tiên/danh mục, page/limit và sắp xếp; kiểm thử qua HTTP |
| 10 | Swagger /api và /api-json; E2E kiểm tra route trong OpenAPI |
| 11 | Global filter và ánh xạ lỗi Prisma; E2E 400/401/404/409/500 |
| 12 | Interceptor đo thời gian thành công, filter đo thời gian lỗi từ middleware, kể cả guard từ chối |
| 13 | Header X-Request-ID, log có cấu trúc và requestId trong lỗi; E2E đối chiếu ID và status, log lỗi một lần |
| 14 | Nhắc hạn trên web theo phạm vi mô tả trên; test task quá hạn/sắp hạn, loại trừ task hoàn thành và dữ liệu người khác |
| 15 | Chạy thành công 20 test API với Supertest và PostgreSQL |

## Lệnh tái kiểm chứng

Chạy trong backend: npm run build, npm run lint, npm test, npm run test:unit, npm run test:e2e.
Chạy trong frontend: npm run build, npm run lint.

Luồng demo: đăng ký → tạo danh mục/nhãn → tạo task có hạn → sửa task và gắn/gỡ nhãn → kiểm tra chuông thông báo → đánh dấu DONE → task biến mất khỏi nhắc nhở. Mở /api để thử dữ liệu sai và truy cập bằng tài khoản thứ hai. Gửi X-Request-ID: demo-123 và đối chiếu ID trong response header/log; phản hồi lỗi cũng có requestId trong body.
