-- NestJS Task Manager
-- PostgreSQL schema and sample data generated from prisma/schema.prisma
-- Import this file into an empty PostgreSQL database with pgAdmin 4.
--
-- Sample login:
--   alice@example.com / StrongPass1!
--   bob@example.com   / StrongPass1!

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "muc_do_uu_tien" AS ENUM (
  'thap',
  'trung_binh',
  'cao',
  'khan_cap'
);

CREATE TYPE "trang_thai_cong_viec" AS ENUM (
  'chua_lam',
  'dang_lam',
  'da_xong',
  'luu_tru'
);

CREATE TYPE "kenh_nhac_nho" AS ENUM (
  'trong_ung_dung',
  'email'
);

CREATE TYPE "trang_thai_nhac_nho" AS ENUM (
  'cho_gui',
  'dang_gui',
  'da_gui',
  'that_bai',
  'huy'
);

CREATE TABLE "nguoi_dung" (
  "ma_nguoi_dung" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL,
  "mat_khau_ma_hoa" VARCHAR(255) NOT NULL,
  "ho_va_ten" VARCHAR(100),
  "mui_gio" VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("ma_nguoi_dung"),
  CONSTRAINT "nguoi_dung_email_key" UNIQUE ("email")
);

CREATE TABLE "danh_muc" (
  "ma_danh_muc" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_nguoi_dung" UUID NOT NULL,
  "ten_danh_muc" VARCHAR(100) NOT NULL,
  "ma_mau_hex" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  "bieu_tuong" VARCHAR(50),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "danh_muc_pkey" PRIMARY KEY ("ma_danh_muc"),
  CONSTRAINT "danh_muc_nguoi_dung_ten_key"
    UNIQUE ("ma_nguoi_dung", "ten_danh_muc"),
  CONSTRAINT "danh_muc_nguoi_dung_fkey"
    FOREIGN KEY ("ma_nguoi_dung") REFERENCES "nguoi_dung"("ma_nguoi_dung")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "cong_viec" (
  "ma_cong_viec" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_nguoi_dung" UUID NOT NULL,
  "ma_danh_muc" UUID,
  "ma_cong_viec_cha" UUID,
  "tieu_de" VARCHAR(255) NOT NULL,
  "mo_ta" TEXT,
  "trang_thai" "trang_thai_cong_viec" NOT NULL DEFAULT 'chua_lam',
  "muc_uu_tien" "muc_do_uu_tien" NOT NULL DEFAULT 'trung_binh',
  "han_chot" TIMESTAMPTZ(6),
  "thoi_diem_hoan_thanh" TIMESTAMPTZ(6),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cong_viec_pkey" PRIMARY KEY ("ma_cong_viec"),
  CONSTRAINT "cong_viec_nguoi_dung_fkey"
    FOREIGN KEY ("ma_nguoi_dung") REFERENCES "nguoi_dung"("ma_nguoi_dung")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cong_viec_danh_muc_fkey"
    FOREIGN KEY ("ma_danh_muc") REFERENCES "danh_muc"("ma_danh_muc")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "cong_viec_cha_fkey"
    FOREIGN KEY ("ma_cong_viec_cha") REFERENCES "cong_viec"("ma_cong_viec")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "nhan" (
  "ma_nhan" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_nguoi_dung" UUID NOT NULL,
  "ten_nhan" VARCHAR(50) NOT NULL,
  "ma_mau_hex" VARCHAR(7) NOT NULL DEFAULT '#6B7280',
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nhan_pkey" PRIMARY KEY ("ma_nhan"),
  CONSTRAINT "nhan_nguoi_dung_ten_key"
    UNIQUE ("ma_nguoi_dung", "ten_nhan"),
  CONSTRAINT "nhan_nguoi_dung_fkey"
    FOREIGN KEY ("ma_nguoi_dung") REFERENCES "nguoi_dung"("ma_nguoi_dung")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "cong_viec_nhan" (
  "ma_cong_viec" UUID NOT NULL,
  "ma_nhan" UUID NOT NULL,
  CONSTRAINT "cong_viec_nhan_pkey"
    PRIMARY KEY ("ma_cong_viec", "ma_nhan"),
  CONSTRAINT "cong_viec_nhan_cong_viec_fkey"
    FOREIGN KEY ("ma_cong_viec") REFERENCES "cong_viec"("ma_cong_viec")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cong_viec_nhan_nhan_fkey"
    FOREIGN KEY ("ma_nhan") REFERENCES "nhan"("ma_nhan")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "nhac_nho" (
  "ma_nhac_nho" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ma_cong_viec" UUID NOT NULL,
  "thoi_gian_nhac" TIMESTAMPTZ(6) NOT NULL,
  "kenh" "kenh_nhac_nho" NOT NULL DEFAULT 'trong_ung_dung',
  "trang_thai" "trang_thai_nhac_nho" NOT NULL DEFAULT 'cho_gui',
  "so_lan_thu" INTEGER NOT NULL DEFAULT 0,
  "thoi_diem_gui" TIMESTAMPTZ(6),
  "loi_cuoi" TEXT,
  "ma_job" VARCHAR(100),
  "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nhac_nho_pkey" PRIMARY KEY ("ma_nhac_nho"),
  CONSTRAINT "nhac_nho_ma_job_key" UNIQUE ("ma_job"),
  CONSTRAINT "nhac_nho_task_time_channel_key"
    UNIQUE ("ma_cong_viec", "thoi_gian_nhac", "kenh"),
  CONSTRAINT "nhac_nho_cong_viec_fkey"
    FOREIGN KEY ("ma_cong_viec") REFERENCES "cong_viec"("ma_cong_viec")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "cong_viec_nguoi_dung_trang_thai_idx"
  ON "cong_viec" ("ma_nguoi_dung", "trang_thai");
CREATE INDEX "cong_viec_nguoi_dung_han_chot_idx"
  ON "cong_viec" ("ma_nguoi_dung", "han_chot");
CREATE INDEX "cong_viec_nguoi_dung_danh_muc_idx"
  ON "cong_viec" ("ma_nguoi_dung", "ma_danh_muc");
CREATE INDEX "cong_viec_nguoi_dung_cong_viec_cha_idx"
  ON "cong_viec" ("ma_nguoi_dung", "ma_cong_viec_cha");
CREATE INDEX "cong_viec_nhan_nhan_idx"
  ON "cong_viec_nhan" ("ma_nhan");
CREATE INDEX "nhac_nho_trang_thai_thoi_gian_nhac_idx"
  ON "nhac_nho" ("trang_thai", "thoi_gian_nhac");

-- Password hash for StrongPass1!, generated with bcrypt.
INSERT INTO "nguoi_dung"
  ("ma_nguoi_dung", "email", "mat_khau_ma_hoa", "ho_va_ten", "mui_gio")
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'alice@example.com',
    '$2b$10$BC3/Yij6PAHMFbSgli49DugTtTFr7LUCEb5sV6NkFKkdXTnF7B7dm',
    'Alice Nguyen',
    'Asia/Ho_Chi_Minh'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'bob@example.com',
    '$2b$10$BC3/Yij6PAHMFbSgli49DugTtTFr7LUCEb5sV6NkFKkdXTnF7B7dm',
    'Bob Tran',
    'Asia/Ho_Chi_Minh'
  );

INSERT INTO "danh_muc"
  ("ma_danh_muc", "ma_nguoi_dung", "ten_danh_muc", "ma_mau_hex", "bieu_tuong")
VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Work',
    '#2563EB',
    'briefcase'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '11111111-1111-4111-8111-111111111111',
    'Personal',
    '#16A34A',
    'home'
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '22222222-2222-4222-8222-222222222222',
    'Study',
    '#9333EA',
    'book'
  );

INSERT INTO "nhan"
  ("ma_nhan", "ma_nguoi_dung", "ten_nhan", "ma_mau_hex")
VALUES
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '11111111-1111-4111-8111-111111111111',
    'urgent',
    '#DC2626'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '11111111-1111-4111-8111-111111111111',
    'blocked',
    '#F59E0B'
  ),
  (
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    '22222222-2222-4222-8222-222222222222',
    'reading',
    '#2563EB'
  );

INSERT INTO "cong_viec"
  (
    "ma_cong_viec",
    "ma_nguoi_dung",
    "ma_danh_muc",
    "tieu_de",
    "mo_ta",
    "trang_thai",
    "muc_uu_tien",
    "han_chot"
  )
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Prepare project presentation',
    'Finish slides and rehearse the demo',
    'chua_lam',
    'cao',
    '2026-10-20 09:00:00+07'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Review project requirements',
    'Check the acceptance criteria before the demo',
    'dang_lam',
    'trung_binh',
    '2026-10-18 17:00:00+07'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Buy groceries',
    'Milk, vegetables and fruit',
    'da_xong',
    'thap',
    '2026-10-14 18:00:00+07'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'Read PostgreSQL documentation',
    'Read the chapters about indexes and foreign keys',
    'chua_lam',
    'trung_binh',
    '2026-10-22 20:00:00+07'
  );

UPDATE "cong_viec"
SET
  "thoi_diem_hoan_thanh" = '2026-10-13 10:00:00+07'
WHERE "ma_cong_viec" = '10000000-0000-4000-8000-000000000003';

INSERT INTO "cong_viec_nhan" ("ma_cong_viec", "ma_nhan")
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    'ffffffff-ffff-4fff-8fff-ffffffffffff'
  );

INSERT INTO "nhac_nho"
  (
    "ma_nhac_nho",
    "ma_cong_viec",
    "thoi_gian_nhac",
    "kenh",
    "trang_thai",
    "ma_job"
  )
VALUES
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '2026-10-19 09:00:00+07',
    'trong_ung_dung',
    'cho_gui',
    'reminder-task-001'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '2026-10-21 20:00:00+07',
    'email',
    'cho_gui',
    'reminder-task-002'
  );

COMMIT;
