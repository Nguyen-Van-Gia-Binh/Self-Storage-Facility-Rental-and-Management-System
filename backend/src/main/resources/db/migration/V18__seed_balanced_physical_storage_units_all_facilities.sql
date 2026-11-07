-- ============================================================================
-- V18__seed_balanced_physical_storage_units_all_facilities.sql
-- Chuẩn hóa và phủ kín ô kho vật lý (storage_unit) đa tầng cho toàn bộ 15 cơ sở
-- 0. Đảm bảo toàn bộ 7 cơ sở mở rộng (ID 9 -> 15) tồn tại đầy đủ trong hệ thống
-- 1. Chuyển các ô kho TX- bị seed nhầm tại Cơ sở 2 về đúng Cơ sở 4 (Thanh Xuân)
-- 2. Bổ sung các loại ô kho còn thiếu cho Cơ sở 2 (Quận 7) và Cơ sở 5 (Quận 1)
-- 3. Phủ kín ô kho thực tế đa tầng (Tầng 1, 2, 3) cho tất cả các cơ sở 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
-- ============================================================================

-- 0. Đảm bảo toàn bộ 7 cơ sở mở rộng (ID 9 -> 15) tồn tại đầy đủ và chuẩn hóa thông tin
INSERT INTO facility (id, code, name, address, phone, description, opening_hours, status)
VALUES
(9,  'FAC-HP', 'Cơ sở Cảng Đình Vũ - Hải Phòng', 'Khu kinh tế Đình Vũ, Phường Đông Hải 2, Quận Hải An, Hải Phòng',            '0225-388-9999', 'Cơ sở kho tự quản logistics trọng điểm cửa ngõ cảng biển Hải Phòng. Diện tích bãi lớn, container ra vào 24/7, tiêu chuẩn an toàn PCCC quốc tế.', '00:00–24:00 (24/7)', 'ACTIVE'),
(10, 'FAC-BN', 'Cơ sở Yên Phong - Bắc Ninh',     'Khu công nghiệp Yên Phong 1, Xã Yên Trung, Huyện Yên Phong, Bắc Ninh',     '0222-389-8888', 'Cơ sở kho bãi thông minh phục vụ chuỗi cung ứng linh kiện điện tử và cư dân khu công nghiệp công nghệ cao Bắc Ninh.', '06:00–22:00', 'ACTIVE'),
(11, 'FAC-DN', 'Cơ sở Hải Châu - Đà Nẵng',        'Số 120 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, TP. Đà Nẵng',    '0236-382-7777', 'Vị trí trung tâm thành phố Đà Nẵng, kết nối sân bay quốc tế và trục tài chính. Hệ thống điều hòa nhiệt ẩm 24/7 hiện đại bậc nhất miền Trung.', '06:00–22:00', 'ACTIVE'),
(12, 'FAC-KH', 'Cơ sở Nha Trang - Khánh Hòa',     'Số 28 Trần Phú, Phường Vĩnh Nguyên, TP. Nha Trang, Khánh Hòa',             '0258-381-6666', 'Cơ sở kho mini tiện ích phục vụ khách du lịch, hộ kinh doanh dịch vụ biển đảo và cư dân đô thị Nha Trang.', '06:00–23:00', 'ACTIVE'),
(13, 'FAC-NA', 'Cơ sở TP. Vinh - Nghệ An',        'Số 88 Lê Lợi, Phường Lê Lợi, TP. Vinh, Nghệ An',                          '0238-384-5555', 'Cơ sở kho tự quản trung tâm vùng Bắc Trung Bộ, giao thông liên tỉnh thuận tiện, camera AI an ninh giám sát 24/7.', '06:00–22:00', 'ACTIVE'),
(14, 'FAC-BD', 'Cơ sở Dĩ An - Bình Dương',        'Số 65 Quốc lộ 1K, Phường Đông Hòa, TP. Dĩ An, Bình Dương',                 '0274-378-4444', 'Cơ sở kho tự quản giáp ranh TP. Thủ Đức và TP. Dĩ An. Phù hợp lưu trữ hàng hóa thương mại điện tử và đồ gia đình các khu đô thị mới.', '00:00–24:00 (24/7)', 'ACTIVE'),
(15, 'FAC-CT', 'Cơ sở Ninh Kiều - Cần Thơ',       'Số 150 Đường 30 Tháng 4, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ', '0292-383-3333', 'Trung tâm tự quản Tây Nam Bộ, bến bốc dỡ hàng hóa thuận tiện, hệ thống kiểm soát nhiệt ẩm chuyên dụng cho nông sản cao cấp và tài liệu.', '06:00–22:00', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    description = EXCLUDED.description,
    opening_hours = EXCLUDED.opening_hours,
    status = EXCLUDED.status;

-- Cập nhật sequence cho facility
SELECT setval(pg_get_serial_sequence('facility', 'id'), COALESCE((SELECT MAX(id) FROM facility), 15));

-- Phân quyền cơ sở 9 -> 15 cho các tài khoản quản lý và nhân viên mẫu
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id FROM app_user u, facility f
WHERE (u.email IN ('manager@storage.vn', 'fm.q1@smartstorage.vn', 'staff@storage.vn', 'staff.q1@smartstorage.vn'))
  AND f.id BETWEEN 9 AND 15
ON CONFLICT (user_id, facility_id) DO NOTHING;

-- Đồng bộ bảng giá niêm yết chuẩn cho các cơ sở mở rộng 9 -> 15
WITH standard_prices (code, monthly_price, price_per_m2) AS (
    VALUES
    ('UT-STD-XS',  350000, 350000),
    ('UT-STD-S',   750000, 250000),
    ('UT-STD-M',  1500000, 250000),
    ('UT-STD-L',  2400000, 240000),
    ('UT-STD-XL', 3500000, 233333),
    ('UT-AC-XS',   500000, 500000),
    ('UT-AC-S',   1100000, 366666),
    ('UT-AC-M',   2100000, 350000),
    ('UT-AC-L',   3400000, 340000),
    ('UT-AC-XL',  4800000, 320000)
)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price, price_per_m2)
SELECT f.id, ut.id, sp.monthly_price, sp.price_per_m2
FROM facility f
CROSS JOIN standard_prices sp
JOIN unit_type ut ON ut.code = sp.code
WHERE f.id BETWEEN 9 AND 15
ON CONFLICT (facility_id, unit_type_id)
DO UPDATE SET
    monthly_price = EXCLUDED.monthly_price,
    price_per_m2  = EXCLUDED.price_per_m2;

WITH standard_prices (code, monthly_price, price_per_m2) AS (
    VALUES
    ('UT-STD-XS',  350000, 350000),
    ('UT-STD-S',   750000, 250000),
    ('UT-STD-M',  1500000, 250000),
    ('UT-STD-L',  2400000, 240000),
    ('UT-STD-XL', 3500000, 233333),
    ('UT-AC-XS',   500000, 500000),
    ('UT-AC-S',   1100000, 366666),
    ('UT-AC-M',   2100000, 350000),
    ('UT-AC-L',   3400000, 340000),
    ('UT-AC-XL',  4800000, 320000)
)
INSERT INTO facility_unit_type_price_version (
    facility_id, unit_type_id, monthly_price, price_per_m2, effective_from, effective_to, created_by
)
SELECT f.id, ut.id, sp.monthly_price, sp.price_per_m2, '2026-01-01 00:00:00+07', NULL,
       COALESCE((SELECT id FROM app_user WHERE email = 'manager@storage.vn' LIMIT 1), 4)
FROM facility f
CROSS JOIN standard_prices sp
JOIN unit_type ut ON ut.code = sp.code
WHERE f.id BETWEEN 9 AND 15
  AND NOT EXISTS (
      SELECT 1 FROM facility_unit_type_price_version v
      WHERE v.facility_id = f.id AND v.unit_type_id = ut.id
  );

-- 1. Chuyển ô kho TX- từ Cơ sở 2 (Quận 7) sang Cơ sở 4 (Thanh Xuân - Hà Nội)
UPDATE storage_unit SET facility_id = 4 WHERE facility_id = 2 AND code LIKE 'TX-%';

-- 2. Bổ sung các loại ô kho hiện đại còn thiếu cho Cơ sở 2 (Quận 7 - TP.HCM)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(2, 7,  'Q7-XS101',    1, 'Khu A', 'Tầng 1 - Khu A - Locker mini giấy tờ và vali cá nhân', 'AVAILABLE'),
(2, 8,  'Q7-XL101',    1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet thương mại 15m²', 'AVAILABLE'),
(2, 9,  'Q7-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ bảo quản máy ảnh & lens độ ẩm 45%', 'AVAILABLE'),
(2, 10, 'Q7-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát dược phẩm chuỗi phân phối', 'AVAILABLE'),
(2, 7,  'Q7-XS201',    2, 'Khu A', 'Tầng 2 - Khu A - Locker mini đồ cá nhân', 'AVAILABLE'),
(2, 8,  'Q7-XL201',    2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet hàng sự kiện', 'AVAILABLE'),
(2, 9,  'Q7-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Hộp giữ ẩm lens máy ảnh và đồng hồ', 'AVAILABLE'),
(2, 10, 'Q7-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát hàng xa xỉ phẩm Nam Sài Gòn', 'AVAILABLE'),
(2, 7,  'Q7-XS301',    3, 'Khu A', 'Tầng 3 - Khu A - Tủ khóa cá nhân sinh viên', 'AVAILABLE'),
(2, 8,  'Q7-XL301',    3, 'Khu C', 'Tầng 3 - Khu C - Kho lưu trữ vật tư triển lãm', 'AVAILABLE'),
(2, 9,  'Q7-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ mát mini đồ hiệu 22°C', 'AVAILABLE'),
(2, 10, 'Q7-AC-XL301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh nhiệt ẩm ổn định Tầng 3', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- 3. Bổ sung các loại ô kho hiện đại còn thiếu cho Cơ sở 5 (Quận 1 - TP.HCM)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(5, 7,  'Q1-XS101',    1, 'Khu A', 'Tầng 1 - Khu A - Locker hành lý khách du lịch lõi Quận 1', 'AVAILABLE'),
(5, 8,  'Q1-XL101',    1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho hàng hóa văn phòng trung tâm', 'AVAILABLE'),
(5, 9,  'Q1-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ bảo quản tài liệu bảo mật & đồng hồ cao cấp', 'AVAILABLE'),
(5, 10, 'Q1-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát hàng xa xỉ phẩm Lê Duẩn', 'AVAILABLE'),
(5, 7,  'Q1-XS201',    2, 'Khu A', 'Tầng 2 - Khu A - Locker cá nhân giấy tờ công ty', 'AVAILABLE'),
(5, 8,  'Q1-XL201',    2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất văn phòng cao cấp', 'AVAILABLE'),
(5, 9,  'Q1-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Hộp giữ ẩm lens máy ảnh studio', 'AVAILABLE'),
(5, 10, 'Q1-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh nhiệt ẩm 24/7 tiêu chuẩn 5 sao', 'AVAILABLE'),
(5, 7,  'Q1-XS301',    3, 'Khu A', 'Tầng 3 - Khu A - Tủ khóa đồ cá nhân an ninh cao', 'AVAILABLE'),
(5, 8,  'Q1-XL301',    3, 'Khu C', 'Tầng 3 - Khu C - Tổng kho lưu trữ tầng 3', 'AVAILABLE'),
(5, 9,  'Q1-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa nhiệt ẩm mini', 'AVAILABLE'),
(5, 10, 'Q1-AC-XL301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát cao cấp tầng 3', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 3: Hai Bà Trưng (Hà Nội) - Prefix: HBT
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(3, 7, 'HBT-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 7, 'HBT-XS102', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 1, 'HBT-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(3, 1, 'HBT-S102', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 2, 'HBT-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(3, 2, 'HBT-M102', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 3, 'HBT-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(3, 8, 'HBT-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 9, 'HBT-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 9, 'HBT-AC-XS102', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 4, 'HBT-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 4, 'HBT-AC-S102', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 5, 'HBT-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 6, 'HBT-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 10, 'HBT-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 7, 'HBT-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(3, 7, 'HBT-XS202', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 1, 'HBT-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 1, 'HBT-S202', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 2, 'HBT-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 2, 'HBT-M202', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 3, 'HBT-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 8, 'HBT-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 9, 'HBT-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 9, 'HBT-AC-XS202', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 4, 'HBT-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(3, 4, 'HBT-AC-S202', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 5, 'HBT-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(3, 6, 'HBT-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 10, 'HBT-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 7, 'HBT-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 1, 'HBT-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 2, 'HBT-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 3, 'HBT-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 8, 'HBT-XL301', 3, 'Khu C', 'Tầng 3 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 9, 'HBT-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 4, 'HBT-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 5, 'HBT-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 6, 'HBT-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(3, 10, 'HBT-AC-XL301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 6: Thủ Đức (TP.HCM) - Prefix: TD
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(6, 7, 'TD-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 7, 'TD-XS102', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 1, 'TD-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(6, 1, 'TD-S102', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 2, 'TD-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(6, 2, 'TD-M102', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 3, 'TD-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(6, 8, 'TD-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 9, 'TD-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 9, 'TD-AC-XS102', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 4, 'TD-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 4, 'TD-AC-S102', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 5, 'TD-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 6, 'TD-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 10, 'TD-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 7, 'TD-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(6, 7, 'TD-XS202', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 1, 'TD-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 1, 'TD-S202', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 2, 'TD-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 2, 'TD-M202', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 3, 'TD-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 8, 'TD-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 9, 'TD-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 9, 'TD-AC-XS202', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 4, 'TD-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(6, 4, 'TD-AC-S202', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 5, 'TD-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(6, 6, 'TD-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 10, 'TD-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 7, 'TD-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 1, 'TD-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 2, 'TD-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 3, 'TD-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 8, 'TD-XL301', 3, 'Khu C', 'Tầng 3 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 9, 'TD-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 4, 'TD-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 5, 'TD-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 6, 'TD-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(6, 10, 'TD-AC-XL301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 7: Bình Thạnh (TP.HCM) - Prefix: BT
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(7, 7, 'BT-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 7, 'BT-XS102', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 1, 'BT-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(7, 1, 'BT-S102', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 2, 'BT-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(7, 2, 'BT-M102', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 3, 'BT-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(7, 8, 'BT-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 9, 'BT-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 9, 'BT-AC-XS102', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 4, 'BT-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 4, 'BT-AC-S102', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 5, 'BT-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 6, 'BT-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 10, 'BT-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 7, 'BT-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(7, 7, 'BT-XS202', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 1, 'BT-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 1, 'BT-S202', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 2, 'BT-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 2, 'BT-M202', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 3, 'BT-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 8, 'BT-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 9, 'BT-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 9, 'BT-AC-XS202', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 4, 'BT-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(7, 4, 'BT-AC-S202', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 5, 'BT-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(7, 6, 'BT-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 10, 'BT-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 7, 'BT-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 1, 'BT-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 2, 'BT-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 3, 'BT-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 8, 'BT-XL301', 3, 'Khu C', 'Tầng 3 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 9, 'BT-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 4, 'BT-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 5, 'BT-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 6, 'BT-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(7, 10, 'BT-AC-XL301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 8: Hà Đông (Hà Nội) - Prefix: HA
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(8, 7, 'HA-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 7, 'HA-XS102', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 1, 'HA-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(8, 1, 'HA-S102', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 2, 'HA-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(8, 2, 'HA-M102', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 3, 'HA-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(8, 8, 'HA-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 9, 'HA-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 9, 'HA-AC-XS102', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 4, 'HA-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 4, 'HA-AC-S102', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 5, 'HA-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 6, 'HA-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 10, 'HA-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 7, 'HA-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(8, 7, 'HA-XS202', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 1, 'HA-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 1, 'HA-S202', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 2, 'HA-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 2, 'HA-M202', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 3, 'HA-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 8, 'HA-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 9, 'HA-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 9, 'HA-AC-XS202', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 4, 'HA-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(8, 4, 'HA-AC-S202', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² dãy trong - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 5, 'HA-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(8, 6, 'HA-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 10, 'HA-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 7, 'HA-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 1, 'HA-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 2, 'HA-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 3, 'HA-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 8, 'HA-XL301', 3, 'Khu C', 'Tầng 3 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 9, 'HA-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 4, 'HA-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 5, 'HA-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 6, 'HA-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(8, 10, 'HA-AC-XL301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 9: Hải Phòng (Hải Phòng) - Prefix: HP
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(9, 7, 'HP-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 1, 'HP-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(9, 2, 'HP-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(9, 3, 'HP-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(9, 8, 'HP-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 9, 'HP-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 4, 'HP-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 5, 'HP-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 6, 'HP-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 10, 'HP-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 7, 'HP-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(9, 1, 'HP-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 2, 'HP-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 3, 'HP-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 8, 'HP-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 9, 'HP-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 4, 'HP-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(9, 5, 'HP-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(9, 6, 'HP-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 10, 'HP-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 7, 'HP-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 1, 'HP-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 2, 'HP-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 3, 'HP-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 9, 'HP-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 4, 'HP-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 5, 'HP-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(9, 6, 'HP-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 10: Bắc Ninh (Bắc Ninh) - Prefix: BN
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(10, 7, 'BN-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 1, 'BN-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(10, 2, 'BN-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(10, 3, 'BN-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(10, 8, 'BN-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 9, 'BN-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 4, 'BN-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 5, 'BN-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 6, 'BN-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 10, 'BN-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 7, 'BN-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(10, 1, 'BN-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 2, 'BN-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 3, 'BN-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 8, 'BN-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 9, 'BN-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 4, 'BN-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(10, 5, 'BN-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(10, 6, 'BN-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 10, 'BN-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 7, 'BN-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 1, 'BN-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 2, 'BN-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 3, 'BN-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 9, 'BN-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 4, 'BN-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 5, 'BN-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(10, 6, 'BN-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 11: Đà Nẵng (Đà Nẵng) - Prefix: DN
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(11, 7, 'DN-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 1, 'DN-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(11, 2, 'DN-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(11, 3, 'DN-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(11, 8, 'DN-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 9, 'DN-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 4, 'DN-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 5, 'DN-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 6, 'DN-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 10, 'DN-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 7, 'DN-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(11, 1, 'DN-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 2, 'DN-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 3, 'DN-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 8, 'DN-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 9, 'DN-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 4, 'DN-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(11, 5, 'DN-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(11, 6, 'DN-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 10, 'DN-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 7, 'DN-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 1, 'DN-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 2, 'DN-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 3, 'DN-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 9, 'DN-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 4, 'DN-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 5, 'DN-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(11, 6, 'DN-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 12: Nha Trang (Khánh Hòa) - Prefix: KH
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(12, 7, 'KH-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 1, 'KH-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(12, 2, 'KH-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(12, 3, 'KH-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(12, 8, 'KH-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 9, 'KH-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 4, 'KH-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 5, 'KH-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 6, 'KH-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 10, 'KH-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 7, 'KH-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(12, 1, 'KH-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 2, 'KH-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 3, 'KH-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 8, 'KH-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 9, 'KH-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 4, 'KH-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(12, 5, 'KH-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(12, 6, 'KH-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 10, 'KH-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 7, 'KH-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 1, 'KH-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 2, 'KH-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 3, 'KH-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 9, 'KH-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 4, 'KH-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 5, 'KH-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(12, 6, 'KH-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 13: Nghệ An (Nghệ An) - Prefix: NA
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(13, 7, 'NA-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 1, 'NA-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(13, 2, 'NA-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(13, 3, 'NA-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(13, 8, 'NA-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 9, 'NA-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 4, 'NA-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 5, 'NA-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 6, 'NA-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 10, 'NA-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 7, 'NA-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(13, 1, 'NA-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 2, 'NA-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 3, 'NA-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 8, 'NA-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 9, 'NA-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 4, 'NA-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(13, 5, 'NA-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(13, 6, 'NA-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 10, 'NA-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 7, 'NA-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 1, 'NA-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 2, 'NA-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 3, 'NA-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 9, 'NA-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 4, 'NA-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 5, 'NA-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(13, 6, 'NA-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 14: Bình Dương (Bình Dương) - Prefix: BD
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(14, 7, 'BD-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 1, 'BD-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(14, 2, 'BD-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(14, 3, 'BD-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(14, 8, 'BD-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 9, 'BD-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 4, 'BD-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 5, 'BD-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 6, 'BD-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 10, 'BD-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 7, 'BD-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(14, 1, 'BD-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 2, 'BD-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 3, 'BD-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 8, 'BD-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 9, 'BD-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 4, 'BD-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(14, 5, 'BD-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(14, 6, 'BD-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 10, 'BD-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 7, 'BD-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 1, 'BD-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 2, 'BD-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 3, 'BD-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 9, 'BD-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 4, 'BD-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 5, 'BD-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(14, 6, 'BD-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- CƠ SỞ 15: Cần Thơ (Cần Thơ) - Prefix: CT
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
(15, 7, 'CT-XS101', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 1, 'CT-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tiêu chuẩn 3m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(15, 2, 'CT-M101', 1, 'Khu B', 'Tầng 1 - Khu B - Kho căn hộ 6m² gần sảnh chính - Đang cho thuê', 'OCCUPIED'),
(15, 3, 'CT-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho nội thất 10m² kiểm tra cảm biến an toàn - Đang bảo trì', 'MAINTENANCE'),
(15, 8, 'CT-XL101', 1, 'Khu C', 'Tầng 1 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 9, 'CT-AC-XS101', 1, 'Khu D', 'Tầng 1 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 4, 'CT-AC-S101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 5, 'CT-AC-M101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 6, 'CT-AC-L101', 1, 'Khu D', 'Tầng 1 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 10, 'CT-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 7, 'CT-XS201', 2, 'Khu A', 'Tầng 2 - Khu A - Tủ Locker mini 1m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(15, 1, 'CT-S201', 2, 'Khu A', 'Tầng 2 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 2, 'CT-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 3, 'CT-L201', 2, 'Khu C', 'Tầng 2 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 8, 'CT-XL201', 2, 'Khu C', 'Tầng 2 - Khu C - Tổng kho pallet 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 9, 'CT-AC-XS201', 2, 'Khu D', 'Tầng 2 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 4, 'CT-AC-S201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho mát đồ hiệu 3m² đối diện thang máy - Đang cho thuê', 'OCCUPIED'),
(15, 5, 'CT-AC-M201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh rượu & piano 6m² điều hòa nhiệt ẩm - Chờ khách nhận kho', 'RESERVED'),
(15, 6, 'CT-AC-L201', 2, 'Khu D', 'Tầng 2 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 10, 'CT-AC-XL201', 2, 'Khu D', 'Tầng 2 - Khu D - Kho lạnh thương mại 15m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 7, 'CT-XS301', 3, 'Khu A', 'Tầng 3 - Khu A - Tủ Locker mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 1, 'CT-S301', 3, 'Khu A', 'Tầng 3 - Khu A - Kho tiêu chuẩn 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 2, 'CT-M301', 3, 'Khu B', 'Tầng 3 - Khu B - Kho căn hộ 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 3, 'CT-L301', 3, 'Khu C', 'Tầng 3 - Khu C - Kho nội thất 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 9, 'CT-AC-XS301', 3, 'Khu D', 'Tầng 3 - Khu D - Tủ điều hòa mini 1m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 4, 'CT-AC-S301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho mát đồ hiệu 3m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 5, 'CT-AC-M301', 3, 'Khu D', 'Tầng 3 - Khu D - Kho lạnh rượu & piano 6m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE'),
(15, 6, 'CT-AC-L301', 3, 'Khu D', 'Tầng 3 - Khu D - Tổng kho mát 10m² thông thoáng - Sẵn sàng cho thuê', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- Đồng bộ sequence cho storage_unit
SELECT setval(pg_get_serial_sequence('storage_unit', 'id'), COALESCE((SELECT MAX(id) FROM storage_unit), 1));
