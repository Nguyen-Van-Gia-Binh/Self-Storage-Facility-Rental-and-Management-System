/* ============================================================================
   Flyway Migration V2__seed_data.sql
   Dữ liệu mẫu khởi tạo cho 5 vai trò, 2 cơ sở, 4 loại kho và 16 ô kho
   ============================================================================ */

-- 1. NGUOI DUNG MAU (Password mặc định: password123)
-- BCrypt hash: $2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy
INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
VALUES
('customer@storage.vn', '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Nguyễn Văn Khách', '0901234567', '001202000001', 'STORAGE_CUSTOMER', 'ACTIVE'),
('staff@storage.vn',    '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Trần Thị Nhân Viên', '0912345678', NULL,           'FACILITY_STAFF', 'ACTIVE'),
('manager@storage.vn',  '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Lê Quản Lý Cơ Sở',  '0923456789', NULL,           'FACILITY_MANAGER', 'ACTIVE'),
('bom@storage.vn',      '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Phạm Giám Đốc BOM', '0934567890', NULL,           'BUSINESS_OPERATIONS_MANAGER', 'ACTIVE'),
('admin@storage.vn',    '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Hoàng Quản Trị Hệ Thống', '0945678901', NULL,      'SYSTEM_ADMINISTRATOR', 'ACTIVE');

-- 2. CO SO LUU TRU (FACILITY)
INSERT INTO facility (code, name, address, status)
VALUES
('FAC-CG', N'Cơ sở Cầu Giấy - Hà Nội', N'Số 19 Duy Tân, Cầu Giấy, Hà Nội', 'ACTIVE'),
('FAC-Q7', N'Cơ sở Quận 7 - TP.HCM', N'Số 10 Mai Văn Vĩnh, Tân Quy, Quận 7, TP.HCM', 'ACTIVE');

-- Gan nhan vien va quan ly vao Co so Cau Giay
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id FROM app_user u, facility f WHERE u.email = 'staff@storage.vn' AND f.code = 'FAC-CG';

INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id FROM app_user u, facility f WHERE u.email = 'manager@storage.vn' AND f.code = 'FAC-CG';

-- 3. LOAI O KHO (UNIT TYPE)
INSERT INTO unit_type (code, name, width_m, length_m, height_m, description)
VALUES
('UT-SMALL',   N'Kho Nhỏ (Small Locker)',  1.0, 1.0, 1.5, N'Phù hợp lưu trữ tài liệu, vali, đồ đạc cá nhân nhỏ gọn.'),
('UT-MEDIUM',  N'Kho Vừa (Medium Unit)',   2.0, 2.0, 2.5, N'Phù hợp đồ dùng phòng trọ, đồ điện gia dụng, xe đạp.'),
('UT-LARGE',   N'Kho Lớn (Large Unit)',    3.0, 3.0, 3.0, N'Phù hợp chuyển nhà trọn gói, nội thất gia đình, hàng kinh doanh.'),
('UT-CLIMATE', N'Kho Lạnh (Climate Unit)', 2.0, 2.5, 2.5, N'Kho điều hòa nhiệt độ ổn định, phù hợp đồ da, rượu vang, thiết bị điện tử.');

-- 4. KHUNG GIA THEO CO SO (FACILITY UNIT TYPE PRICE) - VND/thang
-- Co so Cau Giay (FAC-CG)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 500000 FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';

INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 1200000 FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';

INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2500000 FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';

INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 3000000 FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';

-- Co so Quan 7 (FAC-Q7)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 550000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-SMALL';

INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 1300000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-MEDIUM';

INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2600000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-LARGE';

INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 3200000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-CLIMATE';

-- 5. DANH SACH O KHO VAT LY (STORAGE UNIT) - 16 o kho tai FAC-CG
-- Kho Nho (4 o: 3 AVAILABLE, 1 OCCUPIED)
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-S101', N'Tầng 1 - Khu A', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-S102', N'Tầng 1 - Khu A', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-S103', N'Tầng 1 - Khu A', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-S104', N'Tầng 1 - Khu A', 'OCCUPIED'  FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';

-- Kho Vua (4 o: 3 AVAILABLE, 1 OCCUPIED)
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-M201', N'Tầng 2 - Khu B', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-M202', N'Tầng 2 - Khu B', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-M203', N'Tầng 2 - Khu B', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-M204', N'Tầng 2 - Khu B', 'OCCUPIED'  FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';

-- Kho Lon (4 o: 3 AVAILABLE, 1 MAINTENANCE)
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-L301', N'Tầng 3 - Khu C', 'AVAILABLE'   FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-L302', N'Tầng 3 - Khu C', 'AVAILABLE'   FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-L303', N'Tầng 3 - Khu C', 'AVAILABLE'   FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-L304', N'Tầng 3 - Khu C', 'MAINTENANCE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';

-- Kho Lanh (4 o: 3 AVAILABLE, 1 OCCUPIED)
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-C401', N'Tầng 4 - Khu D', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-C402', N'Tầng 4 - Khu D', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-C403', N'Tầng 4 - Khu D', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';
INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
SELECT f.id, ut.id, 'CG-C404', N'Tầng 4 - Khu D', 'OCCUPIED'  FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';
