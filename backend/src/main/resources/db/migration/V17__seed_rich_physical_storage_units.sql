-- ============================================================================
-- V17__seed_rich_physical_storage_units.sql
-- Bổ sung đầy đủ ô kho vật lý (storage_unit) đa tầng cho hệ thống Self-Storage
-- 1. Phủ kín cả 3 tầng (Tầng 1, Tầng 2, Tầng 3) với cấu trúc phân khu (Khu A, B, C, D).
-- 2. Đầy đủ cả 10 loại ô kho chuẩn Self-Storage:
--    - Tiêu chuẩn: XS (ID 7), S (ID 1), M (ID 2), L (ID 3), XL (ID 8)
--    - Máy lạnh:   XS (ID 9), S (ID 4), M (ID 5), L (ID 6), XL (ID 10)
-- 3. Đa dạng trạng thái trực quan (AVAILABLE, OCCUPIED, MAINTENANCE, RESERVED).
-- ============================================================================

-- BỔ SUNG Ô KHO CHO CƠ SỞ 1 (CẦU GIẤY - HÀ NỘI)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
-- TẦNG 1: KHU A (Tiêu Chuẩn Nhỏ - XS, S) & KHU B (Tiêu Chuẩn Vừa - M)
(1, 7,  'CG-XS101',    1, 'Khu A', 'Tầng 1 - Khu A - Locker mini gần cửa ra vào', 'AVAILABLE'),
(1, 7,  'CG-XS102',    1, 'Khu A', 'Tầng 1 - Khu A - Locker mini cạnh quầy lễ tân', 'RESERVED'),
(1, 1,  'CG-S108',     1, 'Khu A', 'Tầng 1 - Khu A - Dãy giữa thông thoáng', 'AVAILABLE'),
(1, 1,  'CG-S109',     1, 'Khu A', 'Tầng 1 - Khu A - Cạnh thang bộ lối thoát hiểm', 'AVAILABLE'),
(1, 1,  'CG-S110',     1, 'Khu A', 'Tầng 1 - Khu A - Ô góc lối đi chính', 'OCCUPIED'),
(1, 2,  'CG-M101',     1, 'Khu B', 'Tầng 1 - Khu B - Cửa cuốn tự động', 'AVAILABLE'),
(1, 2,  'CG-M102',     1, 'Khu B', 'Tầng 1 - Khu B - Cạnh thang máy tải hàng', 'OCCUPIED'),
(1, 2,  'CG-M103',     1, 'Khu B', 'Tầng 1 - Khu B - Khu trung tâm tầng 1', 'AVAILABLE'),

-- TẦNG 1: KHU C (Tiêu Chuẩn Lớn - L, XL) & KHU D (Máy Lạnh - AC-XS, AC-S, AC-M, AC-L, AC-XL)
(1, 3,  'CG-L105',     1, 'Khu C', 'Tầng 1 - Khu C - Sát vách PCCC tự động', 'AVAILABLE'),
(1, 3,  'CG-L106',     1, 'Khu C', 'Tầng 1 - Khu C - Bảo trì định kỳ cảm biến khói', 'MAINTENANCE'),
(1, 8,  'CG-XL101',    1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho hàng pallet', 'AVAILABLE'),
(1, 8,  'CG-XL102',    1, 'Khu C', 'Tầng 1 - Khu C - Cạnh dock bốc dỡ hàng', 'OCCUPIED'),
(1, 9,  'CG-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Hộp bảo quản máy ảnh/đồng hồ 22°C', 'AVAILABLE'),
(1, 9,  'CG-AC-XS102', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ kiểm soát nhiệt ẩm mini', 'AVAILABLE'),
(1, 4,  'CG-AC-S101',  1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh mỹ phẩm cao cấp', 'AVAILABLE'),
(1, 4,  'CG-AC-S102',  1, 'Khu D', 'Tầng 1 - Khu D - Kho điều hòa đồ da', 'OCCUPIED'),
(1, 5,  'CG-AC-M101',  1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu vang & nhạc cụ', 'AVAILABLE'),
(1, 5,  'CG-AC-M102',  1, 'Khu D', 'Tầng 1 - Khu D - Đang kiểm định nhiệt ẩm kế', 'MAINTENANCE'),
(1, 6,  'CG-AC-L101',  1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát dược phẩm', 'AVAILABLE'),
(1, 6,  'CG-AC-L102',  1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thực phẩm chức năng', 'AVAILABLE'),
(1, 10, 'CG-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh công suất lớn 45m³', 'AVAILABLE'),

-- TẦNG 2: BỔ SUNG ĐẦY ĐỦ CÁC KHU A, B, C, D
(1, 7,  'CG-XS201',    2, 'Khu A', 'Tầng 2 - Khu A - Locker cá nhân giấy tờ', 'AVAILABLE'),
(1, 7,  'CG-XS202',    2, 'Khu A', 'Tầng 2 - Khu A - Locker vali du lịch', 'AVAILABLE'),
(1, 1,  'CG-S203',     2, 'Khu A', 'Tầng 2 - Khu A - Hành lang thoáng', 'AVAILABLE'),
(1, 1,  'CG-S204',     2, 'Khu A', 'Tầng 2 - Khu A - Khách thuê phòng trọ', 'OCCUPIED'),
(1, 1,  'CG-S205',     2, 'Khu A', 'Tầng 2 - Khu A - Đối diện sảnh thang máy', 'AVAILABLE'),
(1, 2,  'CG-M207',     2, 'Khu B', 'Tầng 2 - Khu B - Căn hộ 2 phòng ngủ', 'AVAILABLE'),
(1, 2,  'CG-M208',     2, 'Khu B', 'Tầng 2 - Khu B - Nội thất cơ bản', 'AVAILABLE'),
(1, 2,  'CG-M209',     2, 'Khu B', 'Tầng 2 - Khu B - Đang cho thuê nội thất', 'OCCUPIED'),
(1, 2,  'CG-M210',     2, 'Khu B', 'Tầng 2 - Khu B - Vệ sinh sàn định kỳ', 'MAINTENANCE'),
(1, 3,  'CG-L201',     2, 'Khu C', 'Tầng 2 - Khu C - Chuyển nhà trọn gói', 'AVAILABLE'),
(1, 3,  'CG-L202',     2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất văn phòng', 'AVAILABLE'),
(1, 8,  'CG-XL201',    2, 'Khu C', 'Tầng 2 - Khu C - Kho phân phối vật tư sự kiện', 'AVAILABLE'),
(1, 9,  'CG-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Hộp giữ ẩm lens máy ảnh', 'AVAILABLE'),
(1, 9,  'CG-AC-XS202', 2, 'Khu D', 'Tầng 2 - Khu D - Đơn chờ nhận kho', 'RESERVED'),
(1, 4,  'CG-AC-S201',  2, 'Khu D', 'Tầng 2 - Khu D - Kho đồ da cao cấp', 'AVAILABLE'),
(1, 4,  'CG-AC-S202',  2, 'Khu D', 'Tầng 2 - Khu D - Thiết bị âm thanh Hi-Fi', 'OCCUPIED'),
(1, 5,  'CG-AC-M201',  2, 'Khu D', 'Tầng 2 - Khu D - Hầm rượu gia đình 22°C', 'AVAILABLE'),
(1, 5,  'CG-AC-M202',  2, 'Khu D', 'Tầng 2 - Khu D - Bảo quản đàn Grand Piano', 'AVAILABLE'),
(1, 5,  'CG-AC-M203',  2, 'Khu D', 'Tầng 2 - Khu D - Thuê dài hạn thiết bị studio', 'OCCUPIED'),
(1, 6,  'CG-AC-L201',  2, 'Khu D', 'Tầng 2 - Khu D - Dược mỹ phẩm nhập khẩu', 'AVAILABLE'),
(1, 10, 'CG-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát hàng xa xỉ phẩm', 'AVAILABLE'),

-- TẦNG 3: MỞ MỚI HOÀN TOÀN TẦNG 3 TẠI CƠ SỞ 1
(1, 7,  'CG-XS301',    3, 'Khu A', 'Tầng 3 - Khu A - Locker tài liệu công ty', 'AVAILABLE'),
(1, 7,  'CG-XS302',    3, 'Khu A', 'Tầng 3 - Khu A - Tủ đồ cá nhân sinh viên', 'AVAILABLE'),
(1, 7,  'CG-XS303',    3, 'Khu A', 'Tầng 3 - Khu A - Đang thuê lưu trữ hồ sơ thuế', 'OCCUPIED'),
(1, 7,  'CG-XS304',    3, 'Khu A', 'Tầng 3 - Khu A - Sẵn sàng thuê', 'AVAILABLE'),
(1, 1,  'CG-S301',     3, 'Khu A', 'Tầng 3 - Khu A - Cạnh cầu thang bộ Tầng 3', 'AVAILABLE'),
(1, 1,  'CG-S302',     3, 'Khu A', 'Tầng 3 - Khu A - Lối đi thoáng đãng', 'AVAILABLE'),
(1, 1,  'CG-S303',     3, 'Khu A', 'Tầng 3 - Khu A - Bảo trì hệ thống đèn LED', 'MAINTENANCE'),
(1, 1,  'CG-S304',     3, 'Khu A', 'Tầng 3 - Khu A - Sẵn sàng thuê', 'AVAILABLE'),
(1, 2,  'CG-M301',     3, 'Khu B', 'Tầng 3 - Khu B - Lưu trữ hàng thời trang', 'AVAILABLE'),
(1, 2,  'CG-M302',     3, 'Khu B', 'Tầng 3 - Khu B - Đang thuê shop online', 'OCCUPIED'),
(1, 2,  'CG-M303',     3, 'Khu B', 'Tầng 3 - Khu B - Sẵn sàng thuê', 'AVAILABLE'),
(1, 3,  'CG-L301',     3, 'Khu C', 'Tầng 3 - Khu C - Kho thiết bị văn phòng', 'AVAILABLE'),
(1, 3,  'CG-L302',     3, 'Khu C', 'Tầng 3 - Khu C - Sẵn sàng đón khách thuê', 'AVAILABLE'),
(1, 8,  'CG-XL301',    3, 'Khu C', 'Tầng 3 - Khu C - Tổng kho tầng cao có ánh sáng tốt', 'AVAILABLE'),
(1, 9,  'CG-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Máy lạnh 24/7 kiểm soát độ ẩm', 'AVAILABLE'),
(1, 9,  'CG-AC-XS302', 3, 'Khu D', 'Tầng 3 - Khu D - Sẵn sàng thuê đồ hiệu', 'AVAILABLE'),
(1, 4,  'CG-AC-S301',  3, 'Khu D', 'Tầng 3 - Khu D - Cạnh cửa sổ chống nắng cách nhiệt', 'AVAILABLE'),
(1, 4,  'CG-AC-S302',  3, 'Khu D', 'Tầng 3 - Khu D - Khách VIP thuê cất giữ tranh ảnh', 'OCCUPIED'),
(1, 5,  'CG-AC-M301',  3, 'Khu D', 'Tầng 3 - Khu D - Kho rượu vang nhiệt độ ổn định', 'AVAILABLE'),
(1, 5,  'CG-AC-M302',  3, 'Khu D', 'Tầng 3 - Khu D - Sẵn sàng thuê', 'AVAILABLE'),
(1, 6,  'CG-AC-L301',  3, 'Khu D', 'Tầng 3 - Khu D - Thiết bị y tế tinh vi', 'AVAILABLE'),
(1, 10, 'CG-AC-XL301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho máy lạnh cao cấp Tầng 3', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- BỔ SUNG Ô KHO ĐA TẦNG CHO CƠ SỞ 2 (THANH XUÂN - HÀ NỘI)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
-- TẦNG 1 (TX)
(2, 7,  'TX-XS101',    1, 'Khu A', 'Tầng 1 - Khu A - Locker đồ cá nhân', 'AVAILABLE'),
(2, 7,  'TX-XS102',    1, 'Khu A', 'Tầng 1 - Khu A - Sẵn sàng thuê', 'AVAILABLE'),
(2, 1,  'TX-S101',     1, 'Khu A', 'Tầng 1 - Khu A - Cửa rộng gần thang bộ', 'AVAILABLE'),
(2, 2,  'TX-M101',     1, 'Khu B', 'Tầng 1 - Khu B - Đang thuê dài hạn', 'OCCUPIED'),
(2, 2,  'TX-M102',     1, 'Khu B', 'Tầng 1 - Khu B - Sẵn sàng thuê', 'AVAILABLE'),
(2, 3,  'TX-L101',     1, 'Khu C', 'Tầng 1 - Khu C - Xe đẩy bốc hàng trực tiếp', 'AVAILABLE'),
(2, 8,  'TX-XL101',    1, 'Khu C', 'Tầng 1 - Khu C - Kho pallet thương mại', 'AVAILABLE'),
(2, 9,  'TX-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ mát bảo quản 24/7', 'AVAILABLE'),
(2, 4,  'TX-AC-S101',  1, 'Khu D', 'Tầng 1 - Khu D - Kho đồ da cao cấp', 'AVAILABLE'),
(2, 5,  'TX-AC-M101',  1, 'Khu D', 'Tầng 1 - Khu D - Đang bảo trì dàn lạnh', 'MAINTENANCE'),
(2, 6,  'TX-AC-L101',  1, 'Khu D', 'Tầng 1 - Khu D - Dược mỹ phẩm phân phối', 'AVAILABLE'),

-- TẦNG 2 (TX)
(2, 7,  'TX-XS201',    2, 'Khu A', 'Tầng 2 - Khu A - Locker mini hồ sơ', 'AVAILABLE'),
(2, 1,  'TX-S201',     2, 'Khu A', 'Tầng 2 - Khu A - Kho nhỏ đồ gia đình', 'AVAILABLE'),
(2, 1,  'TX-S202',     2, 'Khu A', 'Tầng 2 - Khu A - Đang thuê', 'OCCUPIED'),
(2, 2,  'TX-M201',     2, 'Khu B', 'Tầng 2 - Khu B - Kho nội thất chung cư', 'AVAILABLE'),
(2, 3,  'TX-L201',     2, 'Khu C', 'Tầng 2 - Khu C - Chuyển nhà trọn gói', 'AVAILABLE'),
(2, 8,  'TX-XL201',    2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho hàng sự kiện', 'AVAILABLE'),
(2, 9,  'TX-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ lạnh mini đồ hiệu', 'AVAILABLE'),
(2, 4,  'TX-AC-S201',  2, 'Khu D', 'Tầng 2 - Khu D - Sẵn sàng thuê', 'AVAILABLE'),
(2, 5,  'TX-AC-M201',  2, 'Khu D', 'Tầng 2 - Khu D - Kho rượu vang', 'AVAILABLE'),

-- TẦNG 3 (TX)
(2, 7,  'TX-XS301',    3, 'Khu A', 'Tầng 3 - Khu A - Tủ khóa cá nhân', 'AVAILABLE'),
(2, 1,  'TX-S301',     3, 'Khu A', 'Tầng 3 - Khu A - Sẵn sàng thuê', 'AVAILABLE'),
(2, 2,  'TX-M301',     3, 'Khu B', 'Tầng 3 - Khu B - Đang thuê', 'OCCUPIED'),
(2, 2,  'TX-M302',     3, 'Khu B', 'Tầng 3 - Khu B - Sẵn sàng thuê', 'AVAILABLE'),
(2, 3,  'TX-L301',     3, 'Khu C', 'Tầng 3 - Khu C - Sẵn sàng thuê', 'AVAILABLE'),
(2, 4,  'TX-AC-S301',  3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh nhiệt ẩm 24/7', 'AVAILABLE'),
(2, 5,  'TX-AC-M301',  3, 'Khu D', 'Tầng 3 - Khu D - Sẵn sàng thuê', 'AVAILABLE'),
(2, 6,  'TX-AC-L301',  3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát tầng 3', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- Đồng bộ sequence cho storage_unit
SELECT setval(pg_get_serial_sequence('storage_unit', 'id'), COALESCE((SELECT MAX(id) FROM storage_unit), 1));
