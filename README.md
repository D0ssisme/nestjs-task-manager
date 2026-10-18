# NestJS Task Manager

Ứng dụng quản lý công việc cá nhân gồm:

- Backend NestJS + TypeScript.
- Frontend React + Vite + TypeScript.
- PostgreSQL chạy bằng Docker Compose.
- Prisma ORM và migration.
- JWT authentication.
- Swagger/OpenAPI.
- Thông báo task quá hạn hoặc sắp đến hạn ngay trên web.

## Công nghệ

### Backend

- NestJS 12, TypeScript, Node.js.
- Prisma 6 và PostgreSQL 16.
- Passport JWT, bcrypt.
- `class-validator`, `class-transformer`, Joi.
- Swagger với `@nestjs/swagger`.
- Jest cho provider unit test.
- Vitest + Supertest cho e2e test.
- Oxlint.

### Frontend

- React 19.
- Vite 7.
- TypeScript.
- Fetch API.

### Hạ tầng

- Docker Compose.
- GitHub Actions CI cho backend.
- Mailpit chỉ được cấu hình như dependency SMTP local; thông báo hiện tại của ứng dụng là in-app trên frontend.

## Cấu trúc

```text
nestjs-task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── auth/
│   │   ├── categories/
│   │   ├── common/
│   │   ├── health/
│   │   ├── mail/
│   │   ├── reminders/
│   │   ├── tags/
│   │   ├── tasks/
│   │   ├── users/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── .env.example
│   ├── docker-compose.yml
│   └── package.json
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
└── .github/workflows/ci.yml
```

## Cấu hình môi trường

### Backend

Tạo file `backend/.env` từ `backend/.env.example`:

```env
DATABASE_URL="postgresql://app:app@localhost:5432/taskdb?schema=public"
JWT_SECRET=change-me-to-a-secret-with-at-least-8-characters
JWT_EXPIRES_IN=15m
PORT=3001

MAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
MAIL_FROM="Task App <no-reply@taskapp.local>"
```

`JWT_SECRET` phải có ít nhất 8 ký tự. Không commit `backend/.env`.

### Frontend

Tạo file `frontend/.env` từ `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3001
```

Sau khi thay đổi biến `VITE_*`, cần khởi động lại Vite.

## Chạy local

### 1. Khởi động PostgreSQL và Mailpit

```powershell
cd C:\nestjs-task-manager\backend
docker compose up -d
docker compose ps
```

PostgreSQL chạy ở `localhost:5432`. Mailpit có:

- SMTP: `localhost:1025`
- Web UI: `http://localhost:8025`

### 2. Cài backend và đồng bộ database

```powershell
cd C:\nestjs-task-manager\backend
npm install
npx prisma generate
npx prisma migrate deploy
```

### 3. Chạy backend

```powershell
cd C:\nestjs-task-manager\backend
npm run start:dev
```

Backend mặc định chạy tại:

```text
http://localhost:3001
```

Swagger UI:

```text
http://localhost:3001/api
```

OpenAPI JSON:

```text
http://localhost:3001/api-json
```

### 4. Chạy frontend

Mở terminal khác:

```powershell
cd C:\nestjs-task-manager\frontend
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5173
```

## Database

Xem dữ liệu bằng Prisma Studio:

```powershell
cd C:\nestjs-task-manager\backend
npx prisma studio
```

Mở `http://localhost:5555`.

Các model chính:

- `User`
- `Task`
- `Category`
- `Tag`
- `TaskTag`
- `Reminder`

Các lệnh Prisma:

```powershell
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npx prisma studio
```

Trong quá trình phát triển schema, dùng:

```powershell
npx prisma migrate dev --name describe-your-change
```

## API chính

Tất cả route bên dưới, trừ register/login, yêu cầu:

```http
Authorization: Bearer <access_token>
```

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập và nhận JWT |
| GET | `/auth/me` | Lấy user hiện tại |
| GET/PATCH/DELETE | `/users/me` | Quản lý profile |
| GET/POST | `/categories` | Liệt kê/tạo category |
| GET/PATCH/DELETE | `/categories/:id` | Xem/sửa/xóa category |
| GET/POST | `/tags` | Liệt kê/tạo tag |
| GET/PATCH/DELETE | `/tags/:id` | Xem/sửa/xóa tag |
| GET/POST | `/tasks` | Liệt kê/tạo task |
| GET/PATCH/DELETE | `/tasks/:id` | Xem/sửa/xóa task |
| POST | `/tasks/:id/tags` | Gắn tag vào task |
| DELETE | `/tasks/:id/tags/:tagId` | Bỏ tag khỏi task |
| GET | `/reminders` | Task quá hạn/sắp hạn trong 24 giờ |

`GET /tasks` hỗ trợ:

```text
status=TODO|IN_PROGRESS|DONE|ARCHIVED
priority=LOW|MEDIUM|HIGH|URGENT
categoryId=<uuid>
page=1
limit=20
sortBy=createdAt|dueAt
order=asc|desc
```

Khi task chuyển sang `DONE`, backend tự set `completedAt`. Khi chuyển khỏi `DONE`, `completedAt` được reset.

## Request lifecycle

Ví dụ với `GET /tasks`:

```text
HTTP request
  → request-id middleware
  → JwtAuthGuard
  → RequestTimingInterceptor (before)
  → ValidationPipe
  → TasksController
  → TasksService
  → PrismaService → PostgreSQL
  → RequestTimingInterceptor (after)
  → JSON response
```

Nếu có lỗi ở các bước xử lý:

```text
Exception
  → AllExceptionsFilter
  → structured JSON error response
```

Project hiện có:

- Global `ValidationPipe`.
- JWT `Guard`.
- Request ID middleware.
- Request timing custom interceptor.
- Global exception filter.
- `@CurrentUser()` custom decorator.
- Global `ConfigModule`.
- Prisma ORM và migration.

## Kiểm thử và chất lượng code

Chạy từ `backend`:

```powershell
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```

Các loại test:

- Jest: provider unit test.
- Vitest + Supertest: HTTP e2e test.
- E2E kiểm tra validation `400`, login sai `401`, thiếu token `401`, ownership, resource không tồn tại `404`, dữ liệu trùng `409`, task/tag và reminder flow.

Frontend:

```powershell
cd C:\nestjs-task-manager\frontend
npm run lint
npm run build
```

## CI

Workflow tại `.github/workflows/ci.yml` chạy khi push hoặc pull request vào `main`/`master`.

CI hiện chạy:

1. PostgreSQL service.
2. `npm ci` trong `backend`.
3. Prisma generate và migration.
4. Backend lint.
5. Jest unit test.
6. Supertest e2e test.
7. Backend build.

Frontend hiện chưa có job riêng trong workflow CI.

## Dừng môi trường local

```powershell
cd C:\nestjs-task-manager\backend
docker compose down
```

Lệnh trên giữ lại dữ liệu PostgreSQL trong volume. Muốn xóa cả dữ liệu:

```powershell
docker compose down -v
```

Chỉ dùng `-v` khi muốn reset database.
