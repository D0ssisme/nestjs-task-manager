# Đáp án hands-on lab

Chỉ xem sau khi đã thử bài tập. Các thay đổi bên dưới dành cho bản sao lab; sản phẩm gốc giữ giới hạn title 255 và limit 100.

## Bài 1 — Title tối đa 120 ký tự

Trong `backend/src/tasks/dto/task.dto.ts`, thay đúng các khai báo title:

```ts
// CreateTaskDto
@ApiProperty({ example: 'Prepare project presentation', maxLength: 120 })
@IsString()
@MinLength(1)
@MaxLength(120)
title!: string;

// UpdateTaskDto
@ApiPropertyOptional({ example: 'Prepare final project presentation', maxLength: 120 })
@ValidateIf((_object, value: unknown) => value !== undefined)
@IsString()
@MinLength(1)
@MaxLength(120)
title?: string;
```

`ValidateIf` chỉ bỏ kiểm tra khi không gửi title; nếu gửi null thì vẫn chạy kiểm tra và bị chặn. Chỉ sửa CreateTaskDto sẽ để PATCH chấp nhận title 121 ký tự. Cột PostgreSQL 255 ký tự vẫn chứa được giá trị hợp lệ của quy tắc 120 nên không cần migration.

## Bài 2 — Limit tối đa 50

Thay thuộc tính limit của `ListTasksQueryDto`:

```ts
@ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 50 })
@IsOptional()
@Type(() => Number)
@IsInt()
@Min(1)
@Max(50)
limit = 20;
```

`transform: true` kết hợp `@Type(() => Number)` chuyển query sang giá trị số. `IsInt` chặn 1.5; `Min` chặn 0; `Max` chặn 51. Giá trị 50 được chấp nhận. `maximum` trong Swagger không thay thế `@Max`.

Kiểm tra tại gốc repo, backend đã chạy:

```powershell
node docs/lab/starter.mjs --exercises
```

Mong đợi 12 ca HTTP đạt và tài khoản thử được dọn. Bộ test có kiểm tra biên cả tạo/cập nhật title, không chỉ một ca thành công.

## Bài 3 — Giải thích trace

| Trường hợp | Thứ tự được ghi nhận | HTTP |
| --- | --- | --- |
| JWT hợp lệ, query hợp lệ | middleware → guard → interceptor.before → pipe → handler → service → orm.findMany → interceptor.after | 200 |
| JWT hợp lệ, limit=0 | middleware → guard → interceptor.before → pipe → filter | 400 |
| Thiếu JWT | middleware → guard → filter | 401 |

Guard chạy trước Pipe. Khi thiếu JWT, Guard từ chối truy cập nên chưa kiểm tra limit và chưa vào service. Khi JWT hợp lệ, Pipe mới kiểm tra query và từ chối limit=0.

Trong đồ án, middleware gán request ID và mốc bắt đầu. Interceptor ghi log request thành công; Filter sử dụng mốc thời gian đó để ghi log lỗi, kể cả lỗi bị Guard chặn. Vì vậy lỗi 401 vẫn có durationMs dù không đi vào Interceptor. Filter tạo JSON lỗi chung có statusCode, timestamp, path, message, requestId; trường error có thể có tùy loại lỗi.

Với ID `lab-pipe-error`, header `x-request-id`, body lỗi và log phải trùng nhau. Thời gian xử lý thay đổi theo máy và từng lần chạy; không sao chép số liệu mẫu thành kết quả thật.

## Câu hỏi tự kiểm tra

- **Vì sao không tự new TasksService trong controller?** Nest giải quyết dependency và quản lý instance; tự new sẽ bỏ qua cơ chế container và buộc tự cấp các dependency như PrismaService.
- **Provider mặc định có phải tạo mới mỗi request?** Không. Provider mặc định singleton trong container ứng dụng; bài test lifecycle kiểm chứng TasksService/PrismaService dùng cùng instance qua hai context.
- **Guard và Interceptor khác gì?** Guard quyết định request có được xử lý; Interceptor bao quanh phần xử lý tiếp theo để thực hiện công việc xuyên suốt. Interceptor không thay thế validation của Pipe.
- **Mọi lỗi có chạy interceptor.after không?** Không. Test chỉ đánh dấu nhánh thành công khi observable phát kết quả; lỗi trong các ca này chuyển tới Filter.
- **Đạt HTTP 400 có chứng minh service chưa được gọi?** Không đủ nếu chỉ nhìn status. Cần đọc cơ chế hoặc trace/spy; bộ kiểm chứng của đồ án có cả trace lifecycle và ca kiểm tra serviceCalls=0.
