# ĐỀ KIỂM TRA THỬ TẠI CHỖ — NESTJS TASK MANAGER

**Dành cho:** Nhóm thực hành NestJS
**Công nghệ:** NestJS, Express, Prisma, PostgreSQL
**Thời gian:** 45 phút
**Hình thức:** Làm trực tiếp trên project; chỉ dùng mã nguồn và báo cáo của nhóm

## 1. Đề bài

Mở rộng API Task Manager bằng chức năng **tìm kiếm công việc của người dùng hiện
tại**. Người dùng gửi một từ khóa; hệ thống tìm không phân biệt hoa thường trong
`title` hoặc `description`.

Chức năng phải tuân thủ các quy tắc sau:

1. Chỉ tìm trong các task thuộc tài khoản đang đăng nhập.
2. Từ khóa được loại bỏ khoảng trắng đầu/cuối và phải có từ 2 ký tự trở lên.
3. Kết quả sắp xếp theo `createdAt` giảm dần.
4. Không trả về `passwordHash`, task của người dùng khác hoặc thông tin lỗi nội bộ.
5. Luồng request phải sử dụng các cơ chế chung đã có của project: JWT Guard,
   `@CurrentUser()`, DTO/`ValidationPipe`, Prisma và exception filter.

## 2. Dữ liệu đầu vào (Input)

Tạo tối thiểu hai tài khoản:

```json
[
  { "email": "alice@example.com", "password": "Alice123!", "fullName": "Alice" },
  { "email": "eve@example.com", "password": "Eve12345!", "fullName": "Eve" }
]
```

Tạo dữ liệu kiểm thử:

```json
[
  { "owner": "alice", "title": "Prepare NestJS presentation", "description": "Review guards and providers" },
  { "owner": "alice", "title": "Buy office supplies", "description": "Notebook and marker" },
  { "owner": "eve", "title": "Review NestJS security", "description": "Prepare JWT notes" },
  { "owner": "eve", "title": "Read database guide", "description": "PostgreSQL and Prisma" }
]
```

Gọi API bằng token của Alice:

```http
GET /api/tasks/search?keyword=nestjs
Authorization: Bearer <alice_access_token>
X-Request-ID: exam-search-001
```

## 3. Yêu cầu kết quả (Output)

Với dữ liệu trên, kết quả phải có dạng tương đương:

```json
{
  "data": [
    {
      "id": "<alice_task_id>",
      "title": "Prepare NestJS presentation",
      "description": "Review guards and providers"
    }
  ],
  "meta": {
    "keyword": "nestjs",
    "total": 1
  }
}
```

Không bắt buộc giữ nguyên thứ tự các thuộc tính JSON, nhưng phải bảo đảm:

- Alice thấy task của Alice có chứa `NestJS`.
- Alice không thấy task `Review NestJS security` của Eve.
- Từ khóa `NESTJS` cho cùng kết quả như `nestjs`.
- `keyword=x` trả về lỗi `400`.
- Không có token hoặc token sai trả về `401`.
- UUID không hợp lệ ở các endpoint task hiện có vẫn trả về `400`.
- Header `X-Request-ID` trong response bằng `exam-search-001`; lỗi cũng có
  `requestId` trong body.

## 4. Các câu hỏi và tiêu chí chấm

### Câu 1 — Tính năng bắt buộc (4 điểm)

Triển khai endpoint tìm kiếm hoàn chỉnh:

- Route/controller nhận request và lấy user hiện tại.
- DTO kiểm tra `keyword` bằng `ValidationPipe`, có trim và giới hạn độ dài
  hợp lý.
- Service truy vấn Prisma bằng điều kiện `userId` kết hợp tìm trong `title` hoặc
  `description`, không lọc dữ liệu ở frontend.
- Response đúng cấu trúc `data`/`meta`, có trạng thái HTTP phù hợp.

### Câu 2 — Bảo mật và chất lượng nền tảng (3 điểm)

Chứng minh bằng request hoặc test:

- Endpoint yêu cầu JWT và dùng `@CurrentUser()`.
- Hai tài khoản không thể đọc dữ liệu của nhau.
- Không để lộ `passwordHash` hay stack trace trong response.
- Có xử lý rõ ràng cho keyword rỗng/quá ngắn và token không hợp lệ.
- Cập nhật Swagger/OpenAPI cho route, query, response và các lỗi chính.

### Câu 3 — Kiểm thử và vận hành (2 điểm)

Bổ sung tối thiểu:

- 1 unit test cho service/provider, hoặc 1 E2E test cho endpoint.
- Test ít nhất một trường hợp thành công và một trường hợp bị từ chối.
- `npm run lint` và `npm run build` chạy thành công.
- Không commit file `.env`; hướng dẫn chạy vẫn dùng được với PostgreSQL qua
  Docker Compose.

### Câu 4 — Kỹ thuật nâng cao (1 điểm)

Chọn **một** trong các yêu cầu sau và cung cấp minh chứng:

- Ghi structured log gồm `requestId`, method, path, status và `durationMs`.
- Viết E2E kiểm tra lỗi validation hoặc lỗi không tìm thấy và đối chiếu
  `requestId` giữa header, body và log.
- Cập nhật CI để chạy test mới và lưu kết quả kiểm thử.

## 5. Quy định nộp bài

Nộp cùng một phiên bản:

1. Mã nguồn đã sửa.
2. Báo cáo ngắn tối đa 2 trang, nêu file đã thay đổi và cách kiểm thử.
3. Minh chứng gồm request/response hoặc ảnh kết quả test.
4. Commit hoặc mã phiên bản dùng để đối chiếu mã nguồn, báo cáo và minh chứng.

Không yêu cầu Redis, BullMQ, RBAC, refresh token, distributed tracing hoặc đóng
gói toàn bộ backend/frontend bằng Docker. Có thể nêu các nội dung này là hướng
phát triển nhưng không tính điểm.

## 6. Thang đánh giá nhanh

| Mức | Điều kiện |
|---|---|
| Đạt | Câu 1 đúng; có JWT/ownership; project build được |
| Khá | Đạt và hoàn thành Câu 2, Câu 3 |
| Tốt | Đạt đầy đủ 4 câu, minh chứng cùng một phiên bản mã nguồn |
| Không đạt | Endpoint bỏ qua xác thực/quyền sở hữu, hoặc project không build được |
