# Bảng phủ kỹ thuật và minh chứng — 19 mục

Phạm vi: đúng bảng nhóm gửi ngày 07/11/2026. Không thêm Redis, queue, WebSocket, RBAC, transaction hay Docker backend/frontend. Giữ nguyên NestJS 12.1.2 và Express 5.2.1; không khai báo NestJS 11.

Kết quả gắn với working tree local. Commit nền và SHA-256 từng file mã nguồn nằm trong [summary.json](evidence/summary.json). SHA-256 giúp đối chiếu đúng code đã kiểm thử, không thay thế commit niêm phong. Bản này không khẳng định đã khóa trước bảo vệ 24 giờ.

Kết quả kiểm chứng lại sau khi khôi phục PostgreSQL: xem summary.json. Bộ test gồm 12 Vitest, 6 Jest provider và 27 E2E.

## Bảng đối chiếu

| TT | Nội dung đã khai báo | Tầng | Vị trí chính | Minh chứng đối chiếu | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| 1 | Module, imports/providers/exports | T1 | backend/src/app.module.ts; các module | backend-build.txt; hai suite E2E khởi tạo AppModule thật | Có triển khai, kiểm chứng local |
| 2 | Controller và routing | T1 | controller auth/tasks/categories/tags | e2e.json: CRUD, HTTP status, param/query/body; openapi.json | Có triển khai, kiểm chứng local |
| 3 | Provider và DI singleton | T1 | TasksService, AuthService, PrismaModule | jest.json; request-lifecycle.json: dependencyInjection; tài liệu DI | Có triển khai, kiểm chứng local |
| 4 | Vòng đời request | T1 | middleware/guard/interceptor/pipe/controller/service/filter | request-lifecycle.json: trace thành công, lỗi pipe và lỗi guard trên GET /tasks; sơ đồ trong request-lifecycle-and-di.md | Đã ghi nhận thứ tự thực tế |
| 5 | DTO và ValidationPipe | T1 | configure-app.ts; tasks/dto/task.dto.ts | validation.json: trường lạ trả 400, serviceCalls=0; E2E kiểm tra transform và UUID/page/limit | Có triển khai, kiểm chứng local |
| 6 | Guard xác thực | T1 | auth/guards/jwt-auth.guard.ts | E2E: token hợp lệ/thiếu token; authentication.json: token bị sửa trả 401 | Có triển khai; không khai báo role |
| 7 | @CurrentUser() | T1 | auth/decorators/current-user.decorator.ts | E2E: thông tin me, task của đúng tài khoản, chặn truy cập chéo | Có triển khai, kiểm chứng local |
| 8 | Interceptor đo thời gian | T1 | common/interceptors/request-timing.interceptor.ts | request-id.json: status, method, path, durationMs; request-lifecycle.json | Có triển khai, kiểm chứng local |
| 9 | Exception Filter | T1 | common/filters/all-exceptions.filter.ts | E2E: 400/401/404/409/500 và không lộ chi tiết lỗi nội bộ | Có triển khai, kiểm chứng local |
| 10 | ConfigModule và cấu hình module động | T1 | app.module.ts; auth.module.ts; config/env.validation.ts | vitest.json: Environment configuration; code forRoot/registerAsync; E2E phát hành và xác minh JWT | Có triển khai, kiểm chứng local |
| 11 | ORM và migration | T1 | prisma/schema.prisma; migrations; PrismaService | prisma-generate.txt; migration-deploy.txt; migration-status.txt; E2E trên PostgreSQL thật | Có triển khai; không khai báo transaction |
| 12 | Băm mật khẩu và quyền sở hữu | T2 | AuthService; service task/category/tag | authentication.json: bcrypt verified; E2E hai tài khoản, ngăn đọc/sửa/xóa và gắn quan hệ chéo | Có triển khai, kiểm chứng local |
| 13 | Dependency, môi trường và hướng dẫn chạy | T2 | package.json/lockfile; README; .env.example | summary.json: versions; backend/frontend build và lint logs; hướng dẫn tái chạy bên dưới | Có triển khai, kiểm chứng local |
| 14 | Docker database và volume | T2 | backend/docker-compose.yml | docker-status.txt: PostgreSQL trên cổng 5433; Compose khai báo pgdata; migration/E2E thành công | Đã dùng cho database |
| 15 | Git và khóa phiên bản | T2 | Repository Git | git-head.txt; git-status.txt; summary.json: workingTreeDirty | Đã dùng Git; CHƯA khóa phiên bản, đúng trạng thái bảng nhóm gửi |
| 16 | Kiểm thử cơ bản và chất lượng | T2 | *.spec.ts; vitest.config.ts; npm scripts | vitest.json; backend-build/lint.txt; frontend-build/lint.txt | Kết quả local; xem số test mới trong report |
| 17 | Jest provider, Supertest E2E, CI | T3 | *.unit.spec.ts; test/*.e2e-spec.ts; .github/workflows/ci.yml | jest.json; e2e.json; workflow có bước chạy test và upload artifacts | Test local được kiểm chứng; CI đã cấu hình, chưa khẳng định chạy thành công trên GitHub |
| 18 | Structured logging và request ID | T3 | middleware, interceptor, filter, main.ts | request-id.json: ID khớp header/body/log; E2E lỗi chỉ log một lần và status 500 đúng | Có triển khai, kiểm chứng local |
| 19 | Swagger/OpenAPI | T3 | configure-app.ts; controller; DTO phản hồi | openapi.json; E2E xác nhận trang /api, Bearer security, các route chính và schema DTO | Có triển khai, kiểm chứng các phần đã khai báo |

Đường dẫn minh chứng trong bảng thuộc thư mục [evidence](evidence/). Báo cáo kiểm thử JSON chứa tên từng ca, trạng thái, thời gian chạy; không cộng lặp số test theo từng dòng của bảng.

## Cách tái kiểm chứng

Yêu cầu Node.js phù hợp lockfile hiện tại, npm và Docker Desktop đang chạy. Cài dependency bằng npm ci trong backend và frontend; tạo backend/.env từ .env.example với cổng database 5433. Không đưa .env vào hồ sơ công khai.

```powershell
node scripts/verify-coverage.mjs
```

Script khởi động service database hiện có, generate Prisma, áp dụng migration, chạy build/lint/Vitest/Jest/E2E/backend/frontend và lưu log/report. E2E tạo tài khoản có hậu tố riêng và xóa dữ liệu tài khoản đó sau test. Script dừng với exit code khác 0 nếu có bước lỗi; chỉ dùng summary có passed=true làm kết quả đạt.

CI dùng cùng các test, có PostgreSQL riêng trên cổng 5432 và lưu artifact backend-evidence. File workflow là bằng chứng đã cấu hình CI; kết quả local không thay cho URL một lượt GitHub Actions thành công. Mục 15 vẫn cần thao tác khóa bản nộp riêng khi nhóm thực sự sẵn sàng.

## Tài liệu dùng khi bảo vệ

- [DI và request lifecycle trên endpoint thật](request-lifecycle-and-di.md).
- [Trace vòng đời request](evidence/request-lifecycle.json).
- [Header/body/log có cùng request ID](evidence/request-id.json).
- [Chặn trường lạ trước service](evidence/validation.json).
- [Bản OpenAPI được lấy từ ứng dụng khi test](evidence/openapi.json).
- [Tổng kết phiên bản, trạng thái và hash mã nguồn](evidence/summary.json).

