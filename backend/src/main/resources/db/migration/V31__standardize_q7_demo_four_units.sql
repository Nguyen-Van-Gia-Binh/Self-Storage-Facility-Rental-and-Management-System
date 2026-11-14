-- ============================================================================
-- V31__standardize_q7_demo_four_units.sql
-- Chuẩn hóa dữ liệu ô kho tại Cơ sở Quận 7 (FAC-Q7, facility_id = 2) phục vụ kịch bản Demo:
-- 1. Tạo đúng 4 ô kho thuộc loại "Kho Tiêu Chuẩn S" (unit_type_id = 1, diện tích 3m²) ở Tầng 1:
--    - Q7-S101 (Tầng 1 - Khu A - Sẵn sàng cho Đơn 1 Happy Case)
--    - Q7-S102 (Tầng 1 - Khu A - Sẵn sàng cho Đơn 2 Sự cố Bumping)
--    - Q7-S103 (Tầng 1 - Khu A - Sẵn sàng cho Đơn 3 Sự cố Hoàn tiền 100%)
--    - Q7-S104 (Tầng 1 - Khu A - Sẵn sàng cho Đơn 4 Check-in Online 24/7)
-- 2. Tạo 1 ô kho thuộc loại lớn hơn "Kho Tiêu Chuẩn M" (unit_type_id = 2, diện tích 6m²) ở Tầng 1:
--    - Q7-M101 (Tầng 1 - Khu B - Ô dự phòng nâng hạng Bumping Mode)
-- 3. Khi 4 đơn trên được đặt, hạng kho Tiêu Chuẩn S sẽ hết sạch chỗ (Capacity = 0),
--    tự động kích hoạt nút [Đăng ký danh sách chờ (Waitlist)] cho khách hàng thứ 5!
-- ============================================================================

-- BƯỚC 1: Bổ sung / Chuẩn hóa 4 ô Tiêu Chuẩn S và 1 ô Tiêu Chuẩn M ở Tầng 1
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
  (2, 1, 'Q7-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² cửa chính', 'AVAILABLE'),
  (2, 1, 'Q7-S102', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² cạnh thang bộ', 'AVAILABLE'),
  (2, 1, 'Q7-S103', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² dãy trong', 'AVAILABLE'),
  (2, 1, 'Q7-S104', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² góc hành lang', 'AVAILABLE'),
  (2, 2, 'Q7-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho tiêu chuẩn lớn 6m² (Ô đền bù nâng hạng Bumping)', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO UPDATE
SET status = 'AVAILABLE',
    unit_type_id = EXCLUDED.unit_type_id,
    floor = EXCLUDED.floor,
    position = EXCLUDED.position,
    location_note = EXCLUDED.location_note;

-- BƯỚC 2: Chuyển các ô Tiêu Chuẩn S dôi dư khác của Cơ sở 2 (nếu có) sang MAINTENANCE
-- để đảm bảo cơ sở chỉ có đúng 4 ô size S phục vụ trọn vẹn kịch bản 4 đơn + Bumping + Waitlist
UPDATE storage_unit
SET status = 'MAINTENANCE'
WHERE facility_id = 2
  AND unit_type_id = 1
  AND code NOT IN ('Q7-S101', 'Q7-S102', 'Q7-S103', 'Q7-S104');

-- BƯỚC 3: Đồng bộ sequence id cho bảng storage_unit
SELECT setval(pg_get_serial_sequence('storage_unit', 'id'), COALESCE((SELECT MAX(id) FROM storage_unit), 1));
