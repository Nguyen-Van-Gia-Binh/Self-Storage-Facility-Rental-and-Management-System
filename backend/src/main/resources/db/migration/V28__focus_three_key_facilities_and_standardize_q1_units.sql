-- ============================================================================
-- V28__focus_three_key_facilities_and_standardize_q1_units.sql
-- 1. Tối ưu hóa danh mục cơ sở phục vụ bảo vệ đồ án:
--    - Giữ lại 3 cơ sở trọng điểm ở trạng thái ACTIVE:
--        + Cơ sở 1: Cầu Giấy - Hà Nội (FAC-CG)
--        + Cơ sở 2: Quận 7 - TP.HCM (FAC-Q7)
--        + Cơ sở 5: Quận 1 - TP.HCM (FAC-Q1) - Cơ sở trọng tâm của WS2
--    - Chuyển toàn bộ các cơ sở còn lại (3, 4, 6..15) sang trạng thái INACTIVE.
-- 2. Chuẩn hóa & bổ sung đầy đủ ô kho vật lý (storage_unit) cho Cơ sở Quận 1 (FAC-Q1):
--    - Phủ kín đầy đủ 10 loại ô kho: Tiêu Chuẩn & Máy Lạnh các kích thước XS, S, M, L, XL.
--    - Đầy đủ trên cả 3 tầng (Tầng 1, Tầng 2, Tầng 3), luôn có sẵn ô kho AVAILABLE
--      để phục vụ trải nghiệm đặt kho mới (Flow 1, Flow 2) mà không xung đột với kịch bản test mẫu.
-- ============================================================================

-- BƯỚC 1: CẬP NHẬT TRẠNG THÁI CƠ SỞ (CHỈ 3 CƠ SỞ TRỌNG ĐIỂM ACTIVE)
UPDATE facility
SET status = 'ACTIVE'
WHERE id IN (1, 2, 5);

UPDATE facility
SET status = 'INACTIVE'
WHERE id NOT IN (1, 2, 5);

-- BƯỚC 2: BỔ SUNG ĐẦY ĐỦ CÁC LOẠI Ô KHO CHO CƠ SỞ 5 (QUẬN 1 - TP.HCM)
-- Bảng loại kho tham chiếu (unit_type):
--   1: UT-STD-S   (Tiêu Chuẩn S - 3m²)
--   2: UT-STD-M   (Tiêu Chuẩn M - 6m²)
--   3: UT-STD-L   (Tiêu Chuẩn L - 10m²)
--   4: UT-AC-S    (Máy Lạnh S - 3m²)
--   5: UT-AC-M    (Máy Lạnh M - 6m²)
--   6: UT-AC-L    (Máy Lạnh L - 10m²)
--   7: UT-STD-XS  (Tiêu Chuẩn XS - 1m²)
--   8: UT-STD-XL  (Tiêu Chuẩn XL - 15m²)
--   9: UT-AC-XS   (Máy Lạnh XS - 1m²)
--  10: UT-AC-XL   (Máy Lạnh XL - 15m²)

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
-- TẦNG 1: Bổ sung các loại kho còn thiếu & ô trống AVAILABLE
(5, 3, 'Q1-B101',    1, 'Khu C', 'Tầng 1 - Khu C - Kho tiêu chuẩn lớn 10m² gần dock bốc dỡ', 'AVAILABLE'),
(5, 5, 'Q1-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát điều hòa 6m² chuyên rượu vang & mỹ phẩm', 'AVAILABLE'),
(5, 6, 'Q1-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² dược phẩm & thực phẩm chức năng', 'AVAILABLE'),
(5, 1, 'Q1-A104',    1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần cửa chính (Sẵn sàng thuê)', 'AVAILABLE'),
(5, 2, 'Q1-A105',    1, 'Khu B', 'Tầng 1 - Khu B - Kho tiêu chuẩn 6m² nội thất cơ bản (Sẵn sàng thuê)', 'AVAILABLE'),
(5, 4, 'Q1-C102',    1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thời trang 3m² kiểm soát độ ẩm 50%', 'AVAILABLE'),

-- TẦNG 2: Bổ sung đầy đủ các size Tiêu Chuẩn & Máy Lạnh
(5, 1, 'Q1-A201',    2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thoáng mát gần thang bộ', 'AVAILABLE'),
(5, 2, 'Q1-A202',    2, 'Khu B', 'Tầng 2 - Khu B - Kho tiêu chuẩn 6m² chứa đồ căn hộ gia đình', 'AVAILABLE'),
(5, 3, 'Q1-B202',    2, 'Khu C', 'Tầng 2 - Khu C - Kho tiêu chuẩn 10m² chuyển nhà trọn gói', 'AVAILABLE'),
(5, 4, 'Q1-C201',    2, 'Khu D', 'Tầng 2 - Khu D - Kho mát 3m² bảo quản thiết bị studio & đồ da', 'AVAILABLE'),
(5, 5, 'Q1-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho điều hòa 6m² bảo quản nhạc cụ & đồ gỗ quý', 'AVAILABLE'),
(5, 6, 'Q1-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho lạnh 10m² phân phối hàng cao cấp', 'AVAILABLE'),

-- TẦNG 3: Bổ sung đầy đủ các size Tiêu Chuẩn & Máy Lạnh
(5, 1, 'Q1-A301',    3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² tài liệu văn phòng dài hạn', 'AVAILABLE'),
(5, 2, 'Q1-A302',    3, 'Khu B', 'Tầng 3 - Khu B - Kho tiêu chuẩn 6m² đồ gia dụng theo mùa', 'AVAILABLE'),
(5, 3, 'Q1-B301',    3, 'Khu C', 'Tầng 3 - Khu C - Kho tiêu chuẩn 10m² nội thất văn phòng lớn', 'AVAILABLE'),
(5, 4, 'Q1-C301',    3, 'Khu D', 'Tầng 3 - Khu D - Kho máy lạnh 3m² trang sức & hồ sơ mật', 'AVAILABLE'),
(5, 5, 'Q1-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát 6m² điều hòa nhiệt ẩm ổn định 22°C', 'AVAILABLE'),
(5, 6, 'Q1-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² lưu trữ dài hạn chuẩn 5 sao', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;
