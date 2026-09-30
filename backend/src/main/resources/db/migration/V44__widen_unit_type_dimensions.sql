-- ====================================================================
-- Migration: V44__widen_unit_type_dimensions.sql
-- Mục đích: Mở rộng kiểu dữ liệu các cột kích thước ô kho (width_m, length_m, height_m)
--           từ DECIMAL(5,2) lên DECIMAL(10,2) trong bảng unit_type nhằm triệt tiêu
--           lỗi Arithmetic Overflow (SQL Error 8115: Arithmetic overflow error
--           converting numeric to data type numeric) khi nhập kích thước lớn hoặc
--           khi người dùng nhập kích thước chưa quy đổi đơn vị.
-- ====================================================================

ALTER TABLE unit_type ALTER COLUMN width_m DECIMAL(10,2) NOT NULL;
ALTER TABLE unit_type ALTER COLUMN length_m DECIMAL(10,2) NOT NULL;
ALTER TABLE unit_type ALTER COLUMN height_m DECIMAL(10,2) NOT NULL;
