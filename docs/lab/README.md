# HANDS-ON LAB — Validation và vòng đời request trong NestJS

**Tài liệu thực hành riêng, nộp cùng báo cáo đồ án Quản lý công việc.**

- Đối tượng: một nhóm khác đã biết TypeScript và HTTP cơ bản.
- Thời lượng: **40 phút**, sau khi chuẩn bị môi trường; có thể dành thêm 5 phút trao đổi.
- Phiên bản theo đồ án: **NestJS 12.1.2, Express 5.2.1, TypeScript 6.0.3, Prisma 6.19.3, PostgreSQL 16, Node.js 24**. Dùng lockfile đi kèm, không đổi phiên bản.
- File đi kèm: [starter.mjs](starter.mjs), [đáp án](answers.md).
- Thực hành trên một bản sao riêng của mã nguồn được nhóm bàn giao. Không sửa bản nộp chính.

## 1. Vì sao chọn chủ đề này? — D0

Chủ đề là **kiểm soát đầu vào và giải thích một request đi qua các cơ chế NestJS**. Đây là phần cốt lõi của công nghệ được sử dụng thật trong đồ án: Controller, Provider/DI, Guard, Pipe, Interceptor và Filter. Giá trị học tập nằm ở việc biết đặt trách nhiệm đúng vị trí: xác thực ở Guard, kiểm tra dữ liệu ở Pipe, nghiệp vụ ở Service, xử lý lỗi ở Filter.

Người học không xây lại CRUD. Người học thay đổi quy tắc nghiệp vụ tại DTO, kiểm tra biên bằng request thật, rồi giải thích vì sao cùng một query sai có thể nhận 401 hoặc 400. Request ID được dùng để đối chiếu response với log. Nội dung này chứng minh cơ chế NestJS sâu hơn việc chỉ tạo controller/service.

## 2. Mục tiêu học tập

Sau lab, người học có thể:

1. Tìm được module, controller và service phục vụ `GET /tasks`; chỉ ra constructor injection và nguồn dữ liệu Prisma.
2. Phân biệt tác dụng của `transform`, `whitelist`, `forbidNonWhitelisted` và decorator validation trong DTO.
3. Thay đổi giới hạn dữ liệu tại DTO, giữ Swagger nhất quán, kiểm tra giá trị đúng/sai tại biên.
4. Giải thích thứ tự Guard → Interceptor trước → Pipe → handler và đường lỗi qua Filter.
5. Dùng `x-request-id` để tìm log tương ứng với một request lỗi và trình bày minh chứng.

## 3. Chuẩn bị trước giờ lab

Nhóm cung cấp toàn bộ mã nguồn hiện tại, bao gồm thư mục `docs/lab`, `backend/test` và lockfile; không chỉ gửi link tới một commit chưa chứa các file này. Ghi commit/version của bản thực sự bàn giao vào phiếu kết quả. Không dùng commit nền để đại diện cho những thay đổi chưa commit.

Máy người học cần Git, Node.js 24, npm, Docker Desktop đang chạy và trình soạn thảo. Các lệnh dưới đây dùng PowerShell. Chỉ cần backend, không cần chạy frontend. Cài dependency và tải image trước giờ học để 40 phút tập trung vào công nghệ.

Từ thư mục gốc của **bản sao lab**:

```powershell
cd backend
npm ci
# Chỉ tạo .env nếu chưa có; không ghi đè cấu hình đang dùng.
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up -d db
npx prisma generate
npx prisma migrate deploy
```

Đối chiếu `backend/.env` với Compose:

```dotenv
DATABASE_URL="postgresql://app:app@localhost:5433/taskdb?schema=public"
JWT_SECRET=lab-only-secret-change-before-real-use
JWT_EXPIRES_IN=15m
PORT=3001
```

Nếu máy đang chạy một bản khác của đồ án, dừng backend đó trước hoặc chọn `PORT` khác và đặt `LAB_API_URL` tương ứng trong terminal chạy script. Không xóa volume database để xử lý lỗi cổng.

Mở terminal A tại `backend`:

```powershell
npm run start:dev
```

Mở Swagger tại `http://localhost:3001/api`. Terminal B đứng ở thư mục gốc repo để chạy các lệnh `node docs/lab/...` bên dưới. Script tự tạo tài khoản riêng, không in JWT; khi kết thúc sẽ xóa đúng tài khoản thử và các task của nó.

## 4. Lộ trình 40 phút

| Bước | Thời gian | Sản phẩm của người học |
| --- | --- | --- |
| 1. Đọc đường đi của request | 5 phút | Sơ đồ, vị trí DI |
| 2. Chạy starter và quan sát | 7 phút | 6 ca HTTP cơ sở đạt |
| 3. Bài tập 1: giới hạn tiêu đề | 8 phút | DTO create/update và kiểm tra biên |
| 4. Bài tập 2: giới hạn phân trang | 7 phút | DTO query và 12 ca HTTP đạt |
| 5. Bài tập 3: truy vết request lỗi | 8 phút | Hai response, log, giải thích thứ tự |
| 6. Tổng hợp minh chứng | 5 phút | Phiếu kết quả và diff mã nguồn |

### Bước 1 — Xác định đường đi của request (5 phút)

Mở lần lượt:

| File trong backend | Điều cần tìm |
| --- | --- |
| `src/app.module.ts` | TasksModule, PrismaModule, đăng ký middleware |
| `src/tasks/tasks.module.ts` | Controller và provider của feature |
| `src/tasks/tasks.controller.ts` | `@UseGuards`, `@Get`, `@Query`, `@CurrentUser`, constructor injection |
| `src/tasks/tasks.service.ts` | Inject PrismaService; lọc dữ liệu theo user |
| `src/configure-app.ts` | Pipe, Filter và Interceptor dùng chung |
| `src/tasks/dto/task.dto.ts` | Quy tắc dữ liệu và chuyển đổi kiểu |

Vẽ lại luồng trên giấy trước khi xem đáp án:

```text
Request → Middleware → Guard → Interceptor (trước) → Pipe
        → Controller → Service → Prisma → PostgreSQL
        → Interceptor (sau) → JSON
```

Nếu một bước ném ngoại lệ chưa được xử lý, Filter tạo phản hồi lỗi. Không vẽ Filter như một bước luôn chạy sau mọi response thành công. DI cung cấp instance cho controller/service khi Nest khởi tạo hoặc giải quyết dependency; không phải một HTTP middleware.

### Bước 2 — Chạy starter (7 phút)

Terminal B, tại gốc repo:

```powershell
node docs/lab/starter.mjs
```

Kết quả mong đợi: `PASS: 6 HTTP checks (baseline mode).` và dòng `CLEANUP`.

| Ca thử | Kết quả mong đợi |
| --- | --- |
| Đăng ký tài khoản thử | 201 |
| `GET /tasks?limit=0`, không JWT | 401 |
| Cùng query, có JWT hợp lệ | 400 |
| `POST /tasks`, thêm `unexpectedField` | 400 |
| Tạo task có title hợp lệ | 201 |
| `GET /tasks?page=1&limit=2` | 200; `meta.page` và `meta.limit` là số |

Đọc hàm `send()` trong starter. Phần tạo tài khoản, gửi JSON, kiểm tra lỗi và dọn dữ liệu đã được cung cấp để không mất thời gian viết lại.

Đối chiếu cấu hình thật:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
```

Trong cấu hình hiện tại, trường lạ **bị từ chối với 400**, không âm thầm loại bỏ. `@ApiProperty()` chỉ mô tả Swagger; decorator `class-validator` mới khai báo quy tắc validation. `@Type(() => Number)` hỗ trợ chuyển query từ chuỗi sang số trước khi kiểm tra.

### Bước 3 — Bài tập 1: giới hạn tiêu đề (8 phút)

Yêu cầu mới trong **bản sao thực hành**: title tối đa 120 ký tự cho cả tạo và cập nhật task. Quy tắc của sản phẩm gốc là 255; thay đổi này chỉ là bài tập, không phải phần đã triển khai trong bản nộp.

1. Mở `backend/src/tasks/dto/task.dto.ts`.
2. Tìm `title` trong `CreateTaskDto` và `UpdateTaskDto`.
3. Thay giới hạn validation; bổ sung `maxLength` cho decorator Swagger tương ứng.
4. Giữ nguyên các decorator khác, đặc biệt `@ValidateIf` của update và giới hạn tối thiểu.

Khung code định hướng, không dán nguyên TODO vào file:

```ts
// CreateTaskDto.title
@ApiProperty({ example: 'Prepare project presentation', maxLength: /* TODO */ })
@IsString()
@MinLength(1)
@MaxLength(/* TODO */)
title!: string;
```

Chờ terminal A biên dịch lại. Chạy:

```powershell
node docs/lab/starter.mjs --exercises
```

Ba ca title 120/121/update phải đạt. Nếu chưa làm bài 2, script **sẽ dừng tại ca limit=51**, vì code gốc vẫn cho phép tới 100. Đây là thất bại dự kiến, không sửa test để bỏ qua.

Không cần sửa Prisma schema: giới hạn 120 ở API nằm trong sức chứa 255 của cột hiện tại. Không thêm `if` vào controller để lặp lại quy tắc DTO.

### Bước 4 — Bài tập 2: giới hạn phân trang (7 phút)

Yêu cầu trong bản sao lab: `limit` là số nguyên từ 1 tới 50; mặc định vẫn là 20.

1. Tìm `ListTasksQueryDto.limit`.
2. Sửa decorator giới hạn trên, giữ `@Type(() => Number)`, `@IsInt()`, `@Min(1)`.
3. Thêm `maximum` đúng vào `@ApiPropertyOptional`.
4. Chạy lại script `--exercises`.

Khung code:

```ts
@ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: /* TODO */ })
@IsOptional()
@Type(() => Number)
@IsInt()
@Min(1)
@Max(/* TODO */)
limit = 20;
```

Kết quả: `PASS: 12 HTTP checks (exercise mode).` và `CLEANUP`. Script kiểm tra 50 được chấp nhận, 51 bị chặn và 1.5 bị chặn; đồng thời vẫn kiểm tra 0 bị chặn từ phần cơ sở.

Mở lại `/api-json`, tìm `CreateTaskDto`, `UpdateTaskDto`, `ListTasksQueryDto` hoặc phần query parameters của `GET /tasks` để đối chiếu `maxLength: 120` và `maximum: 50`. Swagger phải mô tả đúng quy tắc đã sửa.

### Bước 5 — Bài tập 3: truy vết lỗi (8 phút)

Chạy starter, quan sát terminal A và tìm hai request ID cố định:

```text
lab-guard-first
lab-pipe-error
```

Ghi lại `requestId`, `statusCode`, `method`, `path`, `durationMs`. Không yêu cầu một giá trị thời gian cố định; nó phụ thuộc lần chạy. Log và header response phải có cùng ID; response lỗi phải có `requestId` tương ứng.

Trả lời trước khi xem đáp án:

1. Vì sao query `limit=0` có lúc trả 401, có lúc trả 400?
2. Với request thiếu JWT, Pipe và service có được gọi không?
3. Vì sao log lỗi xác thực vẫn có thời gian dù Guard có thể chặn trước Interceptor?

Để quan sát thứ tự bằng test instrument các method thật, mở terminal B:

```powershell
cd backend
$env:TASK_EVIDENCE_DIR = Join-Path (Get-Location) '../docs/lab/results'
npm run test:e2e -- test/request-lifecycle.e2e-spec.ts
Remove-Item Env:TASK_EVIDENCE_DIR
cd ..
```

Mong đợi **4 test đạt**. Đọc `docs/lab/results/request-lifecycle.json` và đối chiếu sơ đồ. HTTP status đơn lẻ không chứng minh tất cả thứ tự nội bộ; trace test mới là minh chứng bổ sung. Test giữ controller/service/ORM thật, dùng spy chuyển tiếp để ghi nhận các bước.

### Bước 6 — Nộp kết quả (5 phút)

Điền phiếu sau và nộp cùng diff hai phần DTO đã sửa:

| Minh chứng | Người học điền |
| --- | --- |
| Tên nhóm, ngày thực hiện | ... |
| Commit/version của bộ mã được bàn giao | ... |
| Các file sửa trong bản sao lab | ... |
| Baseline | 6/6 hoặc mô tả ca lỗi |
| Sau bài 1 và 2 | 12/12 hoặc mô tả ca lỗi |
| Trace lifecycle | 4/4 hoặc mô tả ca lỗi |
| Ảnh/log ca 401 có request ID | ... |
| Ảnh/log ca 400 có request ID | ... |
| Giải thích Guard/Pipe/Interceptor/Filter | 3–5 câu |

Có thể lưu output bằng `node docs/lab/starter.mjs --exercises > docs/lab/results-http.txt 2>&1`. Chỉ kết luận đạt khi có dòng tổng kết PASS và CLEANUP, không chỉ vì file log tồn tại.

## 5. Lỗi thường gặp và kinh nghiệm từ đồ án

Phân biệt lỗi đã gặp khi kiểm chứng đồ án với tình huống dự kiến của người học:

| Tình huống | Dấu hiệu | Cách xử lý |
| --- | --- | --- |
| **Đã gặp khi viết test trace:** spy thay handler làm mất metadata route | `GET /tasks` trả 404 trong test dù controller có route | Giữ metadata của handler khi tạo spy. File test đã cung cấp có bước sao chép Reflect metadata trước khi init app; người học không cần viết lại |
| **Đã gặp khi chạy lệnh:** đang ở backend nhưng thêm backend/ vào đường dẫn | ENOENT hoặc không tìm được file | Kiểm tra `Get-Location`; chỉ dùng lệnh `node docs/lab/...` từ gốc repo |
| Dễ gặp: dùng cổng database 5432 thay vì 5433 | Prisma không kết nối được DB local | Đối chiếu DATABASE_URL và Compose; 5432 là cổng bên trong container, host hiện dùng 5433 |
| Dễ gặp: bỏ `@Type(() => Number)` | Query `limit=2` không qua `@IsInt()` | Giữ chuyển đổi kiểu; query HTTP ban đầu là chuỗi |
| Dễ gặp: nghĩ whitelist tự bỏ trường lạ trong mọi cấu hình | Nhận 400 khi thêm field | Dự án bật thêm `forbidNonWhitelisted`; đây là kết quả đúng |
| Dễ gặp: chỉ sửa Swagger hoặc chỉ sửa CreateTaskDto | Schema đổi nhưng API vẫn nhận dữ liệu sai, hoặc PATCH vẫn lọt | Sửa decorator validation của cả create/update; Swagger chỉ mô tả |
| Dễ gặp: chạy --exercises trước khi sửa DTO | Title 121 được API chấp nhận, test báo FAIL | Đây là test trước thay đổi; hoàn thành bài 1 và 2 rồi chạy lại |
| Dễ gặp: không thấy thay đổi | Server cũ hoặc sai cổng vẫn trả quy tắc cũ | Kiểm tra terminal start:dev biên dịch thành công và LAB_API_URL đúng |

## 6. Tiêu chí hoàn thành và tài liệu tham chiếu

Hoàn thành khi nhóm khác chạy được starter, tự sửa hai quy tắc tại DTO, giải thích đúng đường đi hai request lỗi và nộp được minh chứng có request ID. Không tự quy đổi thành điểm D1–D3 vì ảnh yêu cầu chưa cung cấp mô tả chi tiết các mức này.

Nguồn chính là mã nguồn đi kèm bài lab và [tài liệu DI/request lifecycle của đồ án](../request-lifecycle-and-di.md). Các giới hạn 120/50 là bài tập trên bản sao, không dùng để thay thế bảng minh chứng sản phẩm gốc.
