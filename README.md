# NestJS Task Manager

Backend service cho **hệ thống quản lý task cá nhân**, được xây dựng bằng **NestJS + TypeScript**.

Project được phát triển với mục tiêu tìm hiểu và áp dụng các cơ chế quan trọng của NestJS như:

* Module
* Controller
* Provider / Dependency Injection
* DTO và ValidationPipe
* Guard và Authentication
* Exception Filter
* Interceptor
* Configuration Management
* ORM với Prisma
* PostgreSQL
* Background Job / Reminder
* Email Notification
* Testing
* Docker
* API Documentation với Swagger
* CI với GitHub Actions

---

## 1. Mục tiêu

Project mô phỏng một hệ thống quản lý công việc cá nhân, cho phép người dùng:

* Đăng ký và đăng nhập
* Quản lý công việc
* Phân loại công việc
* Gắn nhãn cho công việc
* Theo dõi trạng thái và mức độ ưu tiên
* Thiết lập thời hạn
* Thiết lập nhắc nhở
* Gửi thông báo email khi đến thời gian nhắc nhở

Phần nghiệp vụ được giữ ở mức đơn giản để tập trung vào việc nghiên cứu kiến trúc và các cơ chế của NestJS.

---

## 2. Công nghệ sử dụng

### Backend

| Công nghệ         | Vai trò                                      |
| ----------------- | -------------------------------------------- |
| NestJS            | Framework backend chính                      |
| TypeScript        | Ngôn ngữ lập trình                           |
| Node.js           | Runtime                                      |
| Prisma            | ORM / Database Access Layer                  |
| PostgreSQL        | Cơ sở dữ liệu                                |
| Passport + JWT    | Authentication                               |
| class-validator   | Validation DTO                               |
| class-transformer | Transform dữ liệu request                    |
| Joi               | Validate biến môi trường                     |
| bcrypt            | Mã hóa mật khẩu                              |
| Nodemailer        | Gửi email                                    |
| Mailpit           | SMTP server dùng trong môi trường phát triển |

### NestJS modules / mechanisms

* `@nestjs/config`
* `@nestjs/jwt`
* `@nestjs/passport`
* `@nestjs/schedule`
* `@nestjs/throttler`
* `@nestjs/swagger`
* `@nestjs/terminus`

### Development / Infrastructure

* Docker
* Docker Compose
* Git
* GitHub
* Vitest
* GitHub Actions

---

## 3. Kiến trúc tổng quan

Request từ client được xử lý theo flow:

```text
Client
  │
  ▼
Controller
  │
  ▼
Service / Provider
  │
  ▼
PrismaService
  │
  ▼
PostgreSQL
```

Một số request có thêm các tầng xử lý của NestJS:

```text
HTTP Request
     │
     ▼
   Guard
     │
     ▼
 ValidationPipe
     │
     ▼
 Controller
     │
     ▼
 Service
     │
     ▼
 Prisma
     │
     ▼
 PostgreSQL
     │
     ▼
 Exception Filter
     │
     ▼
HTTP Response
```

Các cơ chế này giúp tách biệt trách nhiệm giữa routing, validation, authentication, business logic và truy cập dữ liệu.

---

## 4. Cấu trúc project

```text
nestjs-task-manager/
│
├── backend/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   │
│   │   ├── config/
│   │   │   └── env.validation.ts
│   │   │
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   └── interceptors/
│   │   │
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   │
│   │   ├── auth/
│   │   ├── users/
│   │   ├── tasks/
│   │   ├── categories/
│   │   ├── tags/
│   │   ├── reminders/
│   │   ├── mail/
│   │   └── health/
│   │
│   ├── test/
│   │
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
└── README.md
```

---

## 5. Các module chính

### AuthModule

Phụ trách authentication:

* Đăng ký tài khoản
* Đăng nhập
* Hash mật khẩu bằng bcrypt
* Xác thực JWT
* Bảo vệ các API yêu cầu đăng nhập

Flow cơ bản:

```text
Login
  │
  ▼
AuthController
  │
  ▼
AuthService
  │
  ├── Verify password
  │
  └── Generate JWT
          │
          ▼
        Client
```

---

### TasksModule

Module chính của hệ thống.

Cung cấp các chức năng:

* Tạo task
* Xem task
* Cập nhật task
* Xóa task
* Thay đổi trạng thái
* Thay đổi mức độ ưu tiên
* Thiết lập deadline
* Quản lý task cha / task con

Flow:

```text
TasksController
      │
      ▼
TasksService
      │
      ▼
PrismaService
      │
      ▼
PostgreSQL
```

---

### CategoriesModule

Quản lý danh mục công việc.

Ví dụ:

```text
Học tập
Cá nhân
Công việc
Dự án
```

Mỗi người dùng có thể tạo và quản lý danh mục riêng.

---

### TagsModule

Quản lý nhãn của task.

Một task có thể có nhiều tag và một tag có thể được sử dụng cho nhiều task.

Quan hệ:

```text
Task ───< TaskTag >─── Tag
```

---

### RemindersModule

Quản lý thời gian nhắc nhở cho task.

Reminder có thể có các trạng thái:

```text
cho_gui
dang_gui
da_gui
that_bai
huy
```

Thông tin retry được lưu để hỗ trợ xử lý lỗi khi gửi thông báo.

---

### MailModule

Đóng gói chức năng gửi email.

Kiến trúc dự kiến:

```text
ReminderService
      │
      ▼
Reminder Processor
      │
      ▼
MailService
      │
      ▼
SMTP
      │
      ▼
Mail Provider
```

Trong môi trường development, project sử dụng **Mailpit** để kiểm tra email mà không cần gửi email thật.

---

### HealthModule

Cung cấp health check cho backend và các dependency quan trọng.

---

## 6. Database

Project sử dụng:

```text
PostgreSQL
    ▲
    │
Prisma ORM
    ▲
    │
NestJS
```

Các bảng chính:

```text
nguoi_dung
danh_muc
cong_viec
nhan
cong_viec_nhan
nhac_nho
```

Quan hệ chính:

```text
NguoiDung
 ├── DanhMuc
 ├── CongViec
 └── Nhan

CongViec
 ├── DanhMuc
 ├── CongViecCha
 ├── Nhan
 └── NhacNho
```

---

## 7. Environment Variables

Không commit file `.env` chứa thông tin thật.

Tạo file:

```text
.env
```

dựa trên:

```text
.env.example
```

Ví dụ:

```env
DATABASE_URL="postgresql://app:app@localhost:5432/taskdb"

JWT_SECRET=change-me
JWT_EXPIRES_IN=15m

PORT=3000

MAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

MAIL_FROM="Task App <no-reply@taskapp.local>"
```

---

## 8. Chạy project

### Yêu cầu

* Node.js
* npm
* Docker Desktop
* Docker Compose

### Cài đặt dependencies

```bash
cd backend
npm install
```

### Khởi động PostgreSQL và Mailpit

```bash
docker compose up -d
```

Kiểm tra:

```bash
docker compose ps
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Kiểm tra database schema

```bash
npx prisma validate
```

### Chạy migration

```bash
npx prisma migrate dev
```

### Chạy development server

```bash
npm run start:dev
```

Backend mặc định chạy tại:

```text
http://localhost:3000
```

---

## 9. Mailpit

Mailpit được sử dụng để kiểm tra email trong môi trường development.

SMTP:

```text
localhost:1025
```

Web interface:

```text
http://localhost:8025
```

Email được gửi bởi ứng dụng sẽ xuất hiện trong Mailpit thay vì gửi tới email thật.

---

## 10. API Documentation

Project sử dụng **OpenAPI / Swagger** để mô tả API.

Swagger UI dự kiến:

```text
http://localhost:3000/api
```

API documentation mô tả:

* Endpoint
* HTTP method
* Request parameters
* Request body
* Response
* Authentication
* Error response

---

## 11. Validation

Project sử dụng DTO kết hợp với `ValidationPipe`.

Các validation rule được định nghĩa trong DTO thay vì xử lý trực tiếp trong controller.

Global validation:

```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

Điều này giúp:

* Loại bỏ property không được khai báo
* Phát hiện request chứa field không hợp lệ
* Transform dữ liệu request
* Chuẩn hóa validation giữa các API

---

## 12. Error Handling

Project sử dụng global exception filter để chuẩn hóa error response.

Ví dụ:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "path": "/tasks",
  "timestamp": "2026-10-02T12:00:00.000Z"
}
```

Mục tiêu là giúp API có format lỗi thống nhất và dễ debug.

---

## 13. Authentication

Authentication sử dụng:

```text
JWT
+
Passport
+
bcrypt
```

Flow:

```text
Register
   │
   ▼
Hash password
   │
   ▼
PostgreSQL


Login
   │
   ▼
Verify password
   │
   ▼
Generate JWT
   │
   ▼
Client
```

Các API cần xác thực sẽ sử dụng Guard để kiểm tra JWT.

---

## 14. Rate Limiting

Project sử dụng `@nestjs/throttler` để giới hạn số request trong một khoảng thời gian.

Mục đích:

* Giảm request bất thường
* Hạn chế brute-force
* Bảo vệ các endpoint nhạy cảm

---

## 15. Testing

Project sử dụng Vitest cho testing.

Các loại test:

### Unit Test

Kiểm tra logic của service/provider độc lập.

### API / Integration Test

Kiểm tra flow của backend thông qua HTTP request và các module liên quan.

Chạy test:

```bash
npm run test
```

Chạy test watch:

```bash
npm run test:watch
```

Chạy coverage:

```bash
npm run test:cov
```

---

## 16. Docker

Docker Compose cung cấp các dependency cho môi trường development:

```text
┌───────────────────────────┐
│        Docker Compose     │
│                           │
│  PostgreSQL               │
│  port: 5432               │
│                           │
│  Mailpit                  │
│  SMTP: 1025               │
│  Web: 8025                │
└───────────────────────────┘
             ▲
             │
          NestJS
```

Khởi động:

```bash
docker compose up -d
```

Dừng:

```bash
docker compose down
```

---

## 17. Git Workflow

Project sử dụng Git để quản lý source code.

Quy trình đề xuất:

```text
main
 │
 ├── feature/auth
 ├── feature/tasks
 ├── feature/reminders
 └── feature/mail
```

Các thay đổi nên được phát triển trên feature branch và merge thông qua Pull Request.

Commit nên mô tả rõ thay đổi, ví dụ:

```text
feat: add task creation API
feat: add JWT authentication
fix: validate task deadline
test: add task service tests
docs: update API documentation
```

---

## 18. Security

Một số cơ chế bảo mật được áp dụng:

* Password được hash bằng bcrypt
* JWT authentication
* Request validation
* CORS configuration
* Rate limiting
* Không commit secrets vào Git
* Environment variables cho configuration
* Kiểm soát dữ liệu đầu vào trước khi truy cập database

---

## 19. Mục tiêu kỹ thuật của project

Project tập trung vào việc thực hành các cơ chế của NestJS:

```text
NestJS
│
├── Module
├── Controller
├── Provider
├── Dependency Injection
├── DTO
├── ValidationPipe
├── Guard
├── Exception Filter
├── Interceptor
├── Configuration
├── Prisma
├── Authentication
├── Scheduling / Reminder
└── Testing
```

Các kỹ thuật nâng cao chỉ được sử dụng khi có nhu cầu thực tế của hệ thống, nhằm tránh đưa thêm công nghệ không cần thiết.

---

## 20. License

Project được thực hiện cho mục đích học tập và nghiên cứu công nghệ NestJS.
