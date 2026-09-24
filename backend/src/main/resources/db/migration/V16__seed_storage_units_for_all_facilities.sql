/* ============================================================================
   Flyway Migration V16__seed_storage_units_for_all_facilities.sql
   Bổ sung danh sách ô kho vật lý (Storage Units) cho toàn bộ 8 cơ sở toàn quốc (T2.8, T2.10, SC-01, FM-01)
   Phân bổ theo Tầng 1 & Tầng 2, Khu A & Khu B, đủ 4 loại kho (Small, Medium, Large, Climate)
   ============================================================================ */

-- Helper Procedure or Direct Insert with NOT EXISTS check
-- 1. Co so Hai Ba Trung - Ha Noi (FAC-HBT)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-A101', 1, N'Khu A', N'Tầng 1 - Khu A - Cạnh cửa chính', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-A101');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-A102', 1, N'Khu A', N'Tầng 1 - Khu A - Gần sảnh tiếp đón', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-A102');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-A103', 1, N'Khu A', N'Tầng 1 - Khu A - Lối đi hành lang giữa', 'OCCUPIED', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-A103');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-A104', 1, N'Khu A', N'Tầng 1 - Khu A - Lô góc thoáng mát', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-A104');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-A105', 1, N'Khu A', N'Tầng 1 - Khu A - Gần thang máy', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-A105');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-B201', 2, N'Khu B', N'Tầng 2 - Khu B - Cửa rộng xe đẩy vào được', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-B201');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-B202', 2, N'Khu B', N'Tầng 2 - Khu B - Cạnh thang hàng', 'RESERVED', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-B202');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-B203', 2, N'Khu B', N'Tầng 2 - Khu B - Kho kiểm soát nhiệt độ', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-B203');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HBT-B204', 2, N'Khu B', N'Tầng 2 - Khu B - Đang bảo dưỡng định kỳ', 'MAINTENANCE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HBT-B204');

-- 2. Co so Thanh Xuan - Ha Noi (FAC-TX)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TX-A101', 1, N'Khu A', N'Tầng 1 - Khu A - Cạnh cửa vào kho', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TX-A101');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TX-A102', 1, N'Khu A', N'Tầng 1 - Khu A - Kho nhỏ lưu trữ vali', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TX-A102');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TX-A103', 1, N'Khu A', N'Tầng 1 - Khu A - Kho vừa chuyển trọ', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TX-A103');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TX-A104', 1, N'Khu A', N'Tầng 1 - Khu A - Đang sử dụng', 'OCCUPIED', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TX-A104');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TX-B201', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lớn gia đình', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TX-B201');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TX-B202', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lạnh bảo quản rượu', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TX-B202');

-- 3. Co so Quan 1 - TP.HCM (FAC-Q1)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q1-A101', 1, N'Khu A', N'Tầng 1 - Khu A - Mặt tiền sảnh chính', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q1-A101');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q1-A102', 1, N'Khu A', N'Tầng 1 - Khu A - Cạnh bàn tiếp tân', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q1-A102');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q1-A103', 1, N'Khu A', N'Tầng 1 - Khu A - Hợp đồng doanh nghiệp', 'OCCUPIED', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q1-A103');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q1-A104', 1, N'Khu A', N'Tầng 1 - Khu A - Kho đồ nội thất văn phòng', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q1-A104');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q1-B201', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lớn cao cấp', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q1-B201');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q1-B202', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lạnh chuyên dụng', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q1-B202');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q1-B203', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lạnh đang có khách đặt', 'RESERVED', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q1-B203');

-- 4. Co so Quan 7 - TP.HCM (FAC-Q7)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q7-A101', 1, N'Khu A', N'Tầng 1 - Khu A - Cạnh ram dốc bốc dỡ', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q7-A101');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q7-A102', 1, N'Khu A', N'Tầng 1 - Khu A - Dãy kho nhỏ tiêu chuẩn', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q7-A102');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q7-A103', 1, N'Khu A', N'Tầng 1 - Khu A - Kho vừa gia đình', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q7-A103');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q7-A104', 1, N'Khu A', N'Tầng 1 - Khu A - Đang thuê dài hạn', 'OCCUPIED', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q7-A104');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q7-B201', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lớn hàng thương mại', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q7-B201');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q7-B202', 2, N'Khu B', N'Tầng 2 - Khu B - Kho máy lạnh nhiệt ẩm ổn định', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q7-B202');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'Q7-B203', 2, N'Khu B', N'Tầng 2 - Khu B - Kho máy lạnh thiết bị điện tử', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'Q7-B203');

-- 5. Co so Binh Thanh - TP.HCM (FAC-BT)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'BT-A101', 1, N'Khu A', N'Tầng 1 - Khu A - Ngay lối vào', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'BT-A101');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'BT-A102', 1, N'Khu A', N'Tầng 1 - Khu A - Kho đồ cá nhân', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'BT-A102');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'BT-A103', 1, N'Khu A', N'Tầng 1 - Khu A - Kho trung bình đồ đạc', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'BT-A103');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'BT-B201', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lớn chứa hàng shop', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'BT-B201');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'BT-B202', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lạnh đồ mỹ nghệ', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'BT-B202');

-- 6. Co so TP. Thu Duc - TP.HCM (FAC-TD)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TD-A101', 1, N'Khu A', N'Tầng 1 - Khu A - Cạnh cửa vào kho', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TD-A101');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TD-A102', 1, N'Khu A', N'Tầng 1 - Khu A - Kho nhỏ sinh viên', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TD-A102');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TD-A103', 1, N'Khu A', N'Tầng 1 - Khu A - Kho trung bình chuyển nhà', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TD-A103');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TD-B201', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lớn đồ gia dụng', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TD-B201');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'TD-B202', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lạnh thiết bị công nghệ', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'TD-B202');

-- 7. Co so Hai Chau - Da Nang (FAC-HC) — ĐẶC BIỆT ĐẦY ĐỦ CHO TEST CASE ĐÀ NẴNG (SC-01, T2.16)
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-A101', 1, N'Khu A', N'Tầng 1 - Khu A - Mặt tiền lối đi chính', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-A101');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-A102', 1, N'Khu A', N'Tầng 1 - Khu A - Kho nhỏ đồ cá nhân', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-A102');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-A103', 1, N'Khu A', N'Tầng 1 - Khu A - Kho nhỏ góc hành lang', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-SMALL'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-A103');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-A104', 1, N'Khu A', N'Tầng 1 - Khu A - Kho vừa chuyển đồ', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-A104');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-A105', 1, N'Khu A', N'Tầng 1 - Khu A - Kho vừa đang thuê', 'OCCUPIED', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-A105');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-A106', 1, N'Khu A', N'Tầng 1 - Khu A - Kho vừa dự trữ', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-MEDIUM'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-A106');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-B201', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lớn nội thất gia đình', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-B201');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-B202', 2, N'Khu B', N'Tầng 2 - Khu B - Kho lớn đang có hợp đồng', 'OCCUPIED', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-LARGE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-B202');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-B203', 2, N'Khu B', N'Tầng 2 - Khu B - Kho máy lạnh bảo quản đồ da', 'AVAILABLE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-B203');

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status, is_active)
SELECT f.id, ut.id, 'HC-B204', 2, N'Khu B', N'Tầng 2 - Khu B - Kho máy lạnh bảo dưỡng định kỳ', 'MAINTENANCE', 1
FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-CLIMATE'
AND NOT EXISTS (SELECT 1 FROM storage_unit su WHERE su.facility_id = f.id AND su.code = 'HC-B204');
