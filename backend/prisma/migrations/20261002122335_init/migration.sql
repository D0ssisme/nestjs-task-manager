-- CreateEnum
CREATE TYPE "muc_do_uu_tien" AS ENUM ('thap', 'trung_binh', 'cao', 'khan_cap');

-- CreateEnum
CREATE TYPE "trang_thai_cong_viec" AS ENUM ('chua_lam', 'dang_lam', 'da_xong', 'luu_tru');

-- CreateEnum
CREATE TYPE "kenh_nhac_nho" AS ENUM ('trong_ung_dung', 'email');

-- CreateEnum
CREATE TYPE "trang_thai_nhac_nho" AS ENUM ('cho_gui', 'dang_gui', 'da_gui', 'that_bai', 'huy');

-- CreateTable
CREATE TABLE "nguoi_dung" (
    "ma_nguoi_dung" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "mat_khau_ma_hoa" VARCHAR(255) NOT NULL,
    "ho_va_ten" VARCHAR(100),
    "mui_gio" VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("ma_nguoi_dung")
);

-- CreateTable
CREATE TABLE "danh_muc" (
    "ma_danh_muc" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ma_nguoi_dung" UUID NOT NULL,
    "ten_danh_muc" VARCHAR(100) NOT NULL,
    "ma_mau_hex" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "bieu_tuong" VARCHAR(50),
    "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "danh_muc_pkey" PRIMARY KEY ("ma_danh_muc")
);

-- CreateTable
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
    "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cong_viec_pkey" PRIMARY KEY ("ma_cong_viec")
);

-- CreateTable
CREATE TABLE "nhan" (
    "ma_nhan" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ma_nguoi_dung" UUID NOT NULL,
    "ten_nhan" VARCHAR(50) NOT NULL,
    "ma_mau_hex" VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    "ngay_tao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nhan_pkey" PRIMARY KEY ("ma_nhan")
);

-- CreateTable
CREATE TABLE "cong_viec_nhan" (
    "ma_cong_viec" UUID NOT NULL,
    "ma_nhan" UUID NOT NULL,

    CONSTRAINT "cong_viec_nhan_pkey" PRIMARY KEY ("ma_cong_viec","ma_nhan")
);

-- CreateTable
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
    "ngay_cap_nhat" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nhac_nho_pkey" PRIMARY KEY ("ma_nhac_nho")
);

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_email_key" ON "nguoi_dung"("email");

-- CreateIndex
CREATE UNIQUE INDEX "danh_muc_ma_nguoi_dung_ten_danh_muc_key" ON "danh_muc"("ma_nguoi_dung", "ten_danh_muc");

-- CreateIndex
CREATE INDEX "cong_viec_ma_nguoi_dung_trang_thai_idx" ON "cong_viec"("ma_nguoi_dung", "trang_thai");

-- CreateIndex
CREATE INDEX "cong_viec_ma_nguoi_dung_han_chot_idx" ON "cong_viec"("ma_nguoi_dung", "han_chot");

-- CreateIndex
CREATE INDEX "cong_viec_ma_nguoi_dung_ma_danh_muc_idx" ON "cong_viec"("ma_nguoi_dung", "ma_danh_muc");

-- CreateIndex
CREATE INDEX "cong_viec_ma_nguoi_dung_ma_cong_viec_cha_idx" ON "cong_viec"("ma_nguoi_dung", "ma_cong_viec_cha");

-- CreateIndex
CREATE UNIQUE INDEX "nhan_ma_nguoi_dung_ten_nhan_key" ON "nhan"("ma_nguoi_dung", "ten_nhan");

-- CreateIndex
CREATE INDEX "cong_viec_nhan_ma_nhan_idx" ON "cong_viec_nhan"("ma_nhan");

-- CreateIndex
CREATE UNIQUE INDEX "nhac_nho_ma_job_key" ON "nhac_nho"("ma_job");

-- CreateIndex
CREATE INDEX "nhac_nho_trang_thai_thoi_gian_nhac_idx" ON "nhac_nho"("trang_thai", "thoi_gian_nhac");

-- CreateIndex
CREATE UNIQUE INDEX "nhac_nho_ma_cong_viec_thoi_gian_nhac_kenh_key" ON "nhac_nho"("ma_cong_viec", "thoi_gian_nhac", "kenh");

-- AddForeignKey
ALTER TABLE "danh_muc" ADD CONSTRAINT "danh_muc_ma_nguoi_dung_fkey" FOREIGN KEY ("ma_nguoi_dung") REFERENCES "nguoi_dung"("ma_nguoi_dung") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_viec" ADD CONSTRAINT "cong_viec_ma_nguoi_dung_fkey" FOREIGN KEY ("ma_nguoi_dung") REFERENCES "nguoi_dung"("ma_nguoi_dung") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_viec" ADD CONSTRAINT "cong_viec_ma_danh_muc_fkey" FOREIGN KEY ("ma_danh_muc") REFERENCES "danh_muc"("ma_danh_muc") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_viec" ADD CONSTRAINT "cong_viec_ma_cong_viec_cha_fkey" FOREIGN KEY ("ma_cong_viec_cha") REFERENCES "cong_viec"("ma_cong_viec") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhan" ADD CONSTRAINT "nhan_ma_nguoi_dung_fkey" FOREIGN KEY ("ma_nguoi_dung") REFERENCES "nguoi_dung"("ma_nguoi_dung") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_viec_nhan" ADD CONSTRAINT "cong_viec_nhan_ma_cong_viec_fkey" FOREIGN KEY ("ma_cong_viec") REFERENCES "cong_viec"("ma_cong_viec") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cong_viec_nhan" ADD CONSTRAINT "cong_viec_nhan_ma_nhan_fkey" FOREIGN KEY ("ma_nhan") REFERENCES "nhan"("ma_nhan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhac_nho" ADD CONSTRAINT "nhac_nho_ma_cong_viec_fkey" FOREIGN KEY ("ma_cong_viec") REFERENCES "cong_viec"("ma_cong_viec") ON DELETE CASCADE ON UPDATE CASCADE;

   ALTER TABLE "cong_viec"
     ADD CONSTRAINT "chk_cong_viec_khong_tu_cha"
     CHECK ("ma_cong_viec_cha" IS NULL OR "ma_cong_viec_cha" <> "ma_cong_viec");