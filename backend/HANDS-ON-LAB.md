# HANDS-ON LAB
## Xây dựng và quan sát request lifecycle của endpoint `POST /tasks` trong NestJS

**Thời lượng:** 30–45 phút  
**Đối tượng:** Người đã biết TypeScript cơ bản và muốn tìm hiểu request lifecycle trong NestJS.

## D0. Lý do chọn chủ đề

Chủ đề được lựa chọn vì request lifecycle thể hiện rõ bản chất của NestJS, vượt qua việc chỉ xây dựng API CRUD. Người học sẽ quan sát cách một request đi qua Middleware, Guard, Interceptor, Pipe, Controller, Service, Prisma ORM và Exception Filter.

Sau bài lab, người học có thể:

- Giải thích thứ tự xử lý request trong NestJS.
- Gửi request có JWT và request ID.
- Kiểm tra dữ liệu bằng DTO và `ValidationPipe`.
- Quan sát lỗi `400`, `401` và `404`.
- Đọc structured log.
- Truy vết request lỗi bằng `requestId`.

## 1. Mục tiêu học tập

Sau khi hoàn thành, người học có thể:

1. Gửi request đến `POST /tasks`.
2. Phân biệt vai trò của Middleware, Guard, Interceptor, Pipe, Handler và Exception Filter.
3. Phân biệt lỗi authentication và validation.
4. Kiểm tra tác dụng của `whitelist`, `forbidNonWhitelisted` và `transform`.
5. Quan sát response `201 Created`, `400 Bad Request` và `401 Unauthorized`.
6. Đối chiếu `requestId` giữa request, response và terminal log.

## 2. Điều kiện môi trường

| Thành phần | Công nghệ |
|---|---|
| Backend | NestJS 12, TypeScript, Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Công cụ gửi request | Postman |
| Runtime | Node.js |

Mở terminal tại thư mục backend:

```powershell
cd C:\nestjs-task-manager\backend
npm install
```

Đảm bảo file `.env` có các biến:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
PORT=3000
```

Chạy migration nếu cần:

```powershell
npx prisma migrate deploy
```

Khởi động backend:

```powershell
npm run start:dev
```

Địa chỉ backend:

```text
http://localhost:3000
```

Swagger:

```text
http://localhost:3000/api
```

## 3. Request lifecycle

### Nhánh thành công

```text
Client
  ↓
RequestIdMiddleware
  ↓
JwtAuthGuard
  ↓
RequestTimingInterceptor trước Handler
  ↓
ValidationPipe
  ↓
TasksController.create()
  ↓
TasksService.create()
  ↓
PrismaService → PostgreSQL
  ↓
RequestTimingInterceptor sau Handler
  ↓
HTTP 201 Created
```

### Nhánh lỗi

```text
Guard / Pipe / Handler / Service
  ↓
AllExceptionsFilter
  ↓
HTTP Error Response
```

Nếu lỗi xảy ra tại Guard, request không đi tiếp đến Interceptor, Pipe, Controller hoặc Service.

## 4. Starter request

Endpoint:

```http
POST http://localhost:3000/tasks
```

Headers:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
X-Request-Id: trace-task-201
```

Body hợp lệ:

```json
{
  "title": "Học request lifecycle trong NestJS",
  "description": "Thực hành Middleware, Guard, Pipe và Exception Filter",
  "status": "TODO",
  "priority": "HIGH",
  "dueAt": "2026-11-10T09:00:00.000Z"
}
```

Các field của `CreateTaskDto`:

| Field | Bắt buộc | Kiểm tra |
|---|---:|---|
| `title` | Có | String, từ 1 đến 255 ký tự |
| `description` | Không | String |
| `status` | Không | Enum `TaskStatus` |
| `priority` | Không | Enum `TaskPriority` |
| `categoryId` | Không | UUID |
| `parentId` | Không | UUID |
| `dueAt` | Không | Date hợp lệ |

## 5. Các bước thực hiện

### Bước 1: Đăng ký

```http
POST http://localhost:3000/auth/register
```

```json
{
  "email": "lab-user@example.com",
  "password": "password123",
  "fullName": "Lab User"
}
```

### Bước 2: Đăng nhập

```http
POST http://localhost:3000/auth/login
```

```json
{
  "email": "lab-user@example.com",
  "password": "password123"
}
```

Copy `accessToken` từ response và sử dụng dưới dạng:

```text
Bearer <accessToken>
```

### Bước 3: Tạo task hợp lệ

Gửi request `POST /tasks` với body hợp lệ ở trên.

Kết quả mong đợi:

```text
201 Created
```

Structured log có dạng:

```json
{
  "method": "POST",
  "path": "/tasks",
  "requestId": "trace-task-201",
  "statusCode": 201,
  "durationMs": 25.42
}
```

### Bước 4: Body thiếu dữ liệu

Gửi `POST /tasks` với:

```json
{}
```

Kết quả:

```text
400 Bad Request
```

Lỗi được phát hiện bởi `ValidationPipe` và chuẩn hóa bởi `AllExceptionsFilter`.

### Bước 5: Field không được phép

```json
{
  "title": "Task có field lạ",
  "unknownField": "not allowed"
}
```

Kết quả:

```text
400 Bad Request
```

Nguyên nhân là ứng dụng bật:

```ts
whitelist: true
forbidNonWhitelisted: true
```

### Bước 6: JWT không hợp lệ

Gửi request với:

```http
Authorization: Bearer invalid-token
X-Request-Id: trace-task-401
```

Kết quả:

```text
401 Unauthorized
```

Flow:

```text
RequestIdMiddleware
  ↓
JwtAuthGuard
  ↓
UnauthorizedException
  ↓
AllExceptionsFilter
  ↓
401 Response
```

### Bước 7: Truy vết request

Gửi request lỗi với:

```http
X-Request-Id: trace-task-400
```

Đối chiếu cùng giá trị `trace-task-400` tại:

1. Request header.
2. Error response.
3. Backend structured log.

## 6. Bài tập và đáp án

### Bài tập 1: Kiểm tra validation

Gửi:

```json
{
  "title": 123,
  "status": "WRONG_STATUS",
  "categoryId": "not-a-uuid"
}
```

**Đáp án:** Response `400 Bad Request`; request bị chặn bởi `ValidationPipe`, Service không tạo task.

### Bài tập 2: So sánh JWT

Gửi cùng một request hai lần:

```text
Authorization: Bearer <valid-token>
Authorization: Bearer invalid-token
```

**Đáp án:** Token hợp lệ được đi tiếp vào Controller; token sai bị `JwtAuthGuard` chặn và trả `401`. Request bị Guard chặn không đi qua Interceptor và Pipe.

### Bài tập 3: Truy vết lỗi

Gửi body `{}` với:

```http
X-Request-Id: lab-trace-001
```

**Đáp án:** Lỗi phát sinh tại `ValidationPipe`; `AllExceptionsFilter` trả `400`; response và log đều chứa `lab-trace-001`.

## 7. Lỗi thường gặp

### Không tìm thấy `package.json`

Nguyên nhân: terminal không đứng trong thư mục `backend`.

```powershell
cd C:\nestjs-task-manager\backend
```

### Không tìm thấy Docker Compose

```text
no configuration file provided: not found
```

Nguyên nhân: chạy Docker Compose tại thư mục không có file `compose.yml` hoặc `docker-compose.yml`.

### Merge conflict trong TypeScript

```text
TS1185: Merge conflict marker encountered
```

Nguyên nhân: file còn các marker:

```text
<<<<<<< HEAD
=======
>>>>>>> branch-name
```

### `401 Unauthorized`

Kiểm tra:

- Có gửi `Authorization` không.
- Token còn hạn không.
- Token có đúng định dạng `Bearer <token>` không.

### `400 Bad Request`

Kiểm tra:

- Có thiếu `title` không.
- Enum có đúng không.
- UUID có hợp lệ không.
- Body có field lạ không.
- `dueAt` có đúng định dạng ngày không.

### Không thấy structured log

Có thể request bị chặn tại Guard trước khi đi qua Interceptor. Với lỗi Guard, kiểm tra log của `AllExceptionsFilter`.

## 8. Kết quả cần nộp

Người học cần chuẩn bị:

1. Screenshot `POST /tasks` thành công.
2. Screenshot response `201 Created`.
3. Screenshot body sai và response `400`.
4. Screenshot JWT sai và response `401`.
5. Screenshot terminal có structured log.
6. Bảng so sánh JWT hợp lệ và JWT không hợp lệ.
7. Câu trả lời cho ba bài tập.

## 9. Tiêu chí hoàn thành

Người học hoàn thành khi có thể:

- Gửi thành công `POST /tasks`.
- Giải thích được vai trò của Middleware, Guard, Interceptor, Pipe và Exception Filter.
- Tạo lỗi `400` bằng body sai.
- Tạo lỗi `401` bằng JWT sai.
- Đối chiếu `requestId` giữa Postman và terminal.
- Giải thích được request lifecycle của endpoint.

