/* ============================================================================
   Self-Storage Facility Rental and Management System
   File: database/seed_data.sql
   Dữ liệu mẫu khởi tạo (Seed Data) cho phát triển và kiểm thử đồng nhất
   Chạy file này trong SQL Server Management Studio (SSMS) hoặc DBeaver
   ============================================================================ */

USE SelfStorageDB;
GO

PRINT N'--- BẮT ĐẦU SEED DỮ LIỆU MẪU ---';

-- ============================================================================
-- 1. TÀI KHOẢN NGƯỜI DÙNG (APP_USER)
-- Mật khẩu mặc định cho tất cả tài khoản: password123
-- BCrypt Hash: $2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'customer@storage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('customer@storage.vn', '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Nguyễn Văn Khách', '0901234567', '001202000001', 'STORAGE_CUSTOMER', 'ACTIVE');
END

IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'staff@storage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('staff@storage.vn', '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Trần Thị Nhân Viên', '0912345678', NULL, 'FACILITY_STAFF', 'ACTIVE');
END

IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'manager@storage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('manager@storage.vn', '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Lê Quản Lý Cơ Sở', '0923456789', NULL, 'FACILITY_MANAGER', 'ACTIVE');
END

IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'bom@storage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('bom@storage.vn', '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Phạm Giám Đốc BOM', '0934567890', NULL, 'BUSINESS_OPERATIONS_MANAGER', 'ACTIVE');
END

IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'admin@storage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('admin@storage.vn', '$2a$10$w8T0M517Gq6vQZ1uR105t.a5jJ/JgTqT.M4N/bB6qP14vUuYp8ZWy', N'Hoàng Quản Trị Hệ Thống', '0945678901', NULL, 'SYSTEM_ADMINISTRATOR', 'ACTIVE');
END
GO

PRINT N'-> Đã kiểm tra và seed app_user (5 tài khoản).';

-- ============================================================================
-- 2. CƠ SỞ LƯU TRỮ (FACILITY)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM facility WHERE code = 'FAC-CG')
BEGIN
    INSERT INTO facility (code, name, address, status)
    VALUES ('FAC-CG', N'Cơ sở Cầu Giấy - Hà Nội', N'Số 19 Duy Tân, Cầu Giấy, Hà Nội', 'ACTIVE');
END

IF NOT EXISTS (SELECT 1 FROM facility WHERE code = 'FAC-Q7')
BEGIN
    INSERT INTO facility (code, name, address, status)
    VALUES ('FAC-Q7', N'Cơ sở Quận 7 - TP.HCM', N'Số 10 Mai Văn Vĩnh, Tân Quy, Quận 7, TP.HCM', 'ACTIVE');
END
GO

-- Gán nhân viên và quản lý vào Cơ sở Cầu Giấy
IF NOT EXISTS (
    SELECT 1 FROM user_facility_assignment ufa
    JOIN app_user u ON ufa.user_id = u.id
    JOIN facility f ON ufa.facility_id = f.id
    WHERE u.email = 'staff@storage.vn' AND f.code = 'FAC-CG'
)
BEGIN
    INSERT INTO user_facility_assignment (user_id, facility_id)
    SELECT u.id, f.id FROM app_user u, facility f WHERE u.email = 'staff@storage.vn' AND f.code = 'FAC-CG';
END

IF NOT EXISTS (
    SELECT 1 FROM user_facility_assignment ufa
    JOIN app_user u ON ufa.user_id = u.id
    JOIN facility f ON ufa.facility_id = f.id
    WHERE u.email = 'manager@storage.vn' AND f.code = 'FAC-CG'
)
BEGIN
    INSERT INTO user_facility_assignment (user_id, facility_id)
    SELECT u.id, f.id FROM app_user u, facility f WHERE u.email = 'manager@storage.vn' AND f.code = 'FAC-CG';
END
GO

PRINT N'-> Đã kiểm tra và seed facility & user_facility_assignment.';

-- ============================================================================
-- 3. LOẠI Ô KHO (UNIT_TYPE)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM unit_type WHERE code = 'UT-SMALL')
BEGIN
    INSERT INTO unit_type (code, name, width_m, length_m, height_m, description)
    VALUES ('UT-SMALL', N'Kho Nhỏ (Small Locker)', 1.0, 1.0, 1.5, N'Phù hợp lưu trữ tài liệu, vali, đồ đạc cá nhân nhỏ gọn.');
END

IF NOT EXISTS (SELECT 1 FROM unit_type WHERE code = 'UT-MEDIUM')
BEGIN
    INSERT INTO unit_type (code, name, width_m, length_m, height_m, description)
    VALUES ('UT-MEDIUM', N'Kho Vừa (Medium Unit)', 2.0, 2.0, 2.5, N'Phù hợp đồ dùng phòng trọ, đồ điện gia dụng, xe đạp.');
END

IF NOT EXISTS (SELECT 1 FROM unit_type WHERE code = 'UT-LARGE')
BEGIN
    INSERT INTO unit_type (code, name, width_m, length_m, height_m, description)
    VALUES ('UT-LARGE', N'Kho Lớn (Large Unit)', 3.0, 3.0, 3.0, N'Phù hợp chuyển nhà trọn gói, nội thất gia đình, hàng kinh doanh.');
END

IF NOT EXISTS (SELECT 1 FROM unit_type WHERE code = 'UT-CLIMATE')
BEGIN
    INSERT INTO unit_type (code, name, width_m, length_m, height_m, description)
    VALUES ('UT-CLIMATE', N'Kho Lạnh (Climate Unit)', 2.0, 2.5, 2.5, N'Kho điều hòa nhiệt độ ổn định, phù hợp đồ da, rượu vang, thiết bị điện tử.');
END
GO

-- ============================================================================
-- 4. BẢNG GIÁ THEO CƠ SỞ (FACILITY_UNIT_TYPE_PRICE)
-- ============================================================================
-- Cầu Giấy (FAC-CG)
IF NOT EXISTS (SELECT 1 FROM facility_unit_type_price futp JOIN facility f ON futp.facility_id = f.id JOIN unit_type ut ON futp.unit_type_id = ut.id WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL')
    INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
    SELECT f.id, ut.id, 500000 FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';

IF NOT EXISTS (SELECT 1 FROM facility_unit_type_price futp JOIN facility f ON futp.facility_id = f.id JOIN unit_type ut ON futp.unit_type_id = ut.id WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM')
    INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
    SELECT f.id, ut.id, 1200000 FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';

IF NOT EXISTS (SELECT 1 FROM facility_unit_type_price futp JOIN facility f ON futp.facility_id = f.id JOIN unit_type ut ON futp.unit_type_id = ut.id WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE')
    INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
    SELECT f.id, ut.id, 2500000 FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';

IF NOT EXISTS (SELECT 1 FROM facility_unit_type_price futp JOIN facility f ON futp.facility_id = f.id JOIN unit_type ut ON futp.unit_type_id = ut.id WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE')
    INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
    SELECT f.id, ut.id, 3000000 FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';

-- Quận 7 (FAC-Q7)
IF NOT EXISTS (SELECT 1 FROM facility_unit_type_price futp JOIN facility f ON futp.facility_id = f.id JOIN unit_type ut ON futp.unit_type_id = ut.id WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-SMALL')
    INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
    SELECT f.id, ut.id, 550000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-SMALL';

IF NOT EXISTS (SELECT 1 FROM facility_unit_type_price futp JOIN facility f ON futp.facility_id = f.id JOIN unit_type ut ON futp.unit_type_id = ut.id WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-MEDIUM')
    INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
    SELECT f.id, ut.id, 1300000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-MEDIUM';

IF NOT EXISTS (SELECT 1 FROM facility_unit_type_price futp JOIN facility f ON futp.facility_id = f.id JOIN unit_type ut ON futp.unit_type_id = ut.id WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-LARGE')
    INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
    SELECT f.id, ut.id, 2600000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-LARGE';

IF NOT EXISTS (SELECT 1 FROM facility_unit_type_price futp JOIN facility f ON futp.facility_id = f.id JOIN unit_type ut ON futp.unit_type_id = ut.id WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-CLIMATE')
    INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
    SELECT f.id, ut.id, 3200000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q7' AND ut.code = 'UT-CLIMATE';
GO

PRINT N'-> Đã kiểm tra và seed unit_type & facility_unit_type_price.';

-- ============================================================================
-- 5. DANH SÁCH Ô KHO VẬT LÝ (STORAGE_UNIT) - 16 Ô KHO TẠI FAC-CG
-- ============================================================================
-- Kho Nhỏ
IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-S101')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-S101', N'Tầng 1 - Khu A', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-S102')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-S102', N'Tầng 1 - Khu A', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-S103')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-S103', N'Tầng 1 - Khu A', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-S104')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-S104', N'Tầng 1 - Khu A', 'OCCUPIED'  FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-SMALL';

-- Kho Vừa
IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-M201')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-M201', N'Tầng 2 - Khu B', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-M202')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-M202', N'Tầng 2 - Khu B', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-M203')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-M203', N'Tầng 2 - Khu B', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-M204')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-M204', N'Tầng 2 - Khu B', 'OCCUPIED'  FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-MEDIUM';

-- Kho Lớn
IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-L301')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-L301', N'Tầng 3 - Khu C', 'AVAILABLE'   FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-L302')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-L302', N'Tầng 3 - Khu C', 'AVAILABLE'   FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-L303')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-L303', N'Tầng 3 - Khu C', 'AVAILABLE'   FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-L304')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-L304', N'Tầng 3 - Khu C', 'MAINTENANCE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-LARGE';

-- Kho Lạnh
IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-C401')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-C401', N'Tầng 4 - Khu D', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-C402')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-C402', N'Tầng 4 - Khu D', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-C403')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-C403', N'Tầng 4 - Khu D', 'AVAILABLE' FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';

IF NOT EXISTS (SELECT 1 FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-C404')
    INSERT INTO storage_unit (facility_id, unit_type_id, code, location_note, status)
    SELECT f.id, ut.id, 'CG-C404', N'Tầng 4 - Khu D', 'OCCUPIED'  FROM facility f, unit_type ut WHERE f.code = 'FAC-CG' AND ut.code = 'UT-CLIMATE';
GO

PRINT N'-> Đã kiểm tra và seed storage_unit (16 ô kho).';

-- ============================================================================
-- 6. CHÍNH SÁCH VẬN HÀNH (POLICY_VERSION)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM policy_version WHERE version_no = 1)
BEGIN
    INSERT INTO policy_version (
        version_no, effective_from, deposit_multiplier, reservation_hold_hours,
        checkin_grace_days, cancel_full_refund_hours, cancel_late_refund_rate,
        cancel_no_show_refund_rate, renewal_reminder_days, renewal_min_months,
        renewal_max_months, overdue_grace_days, overdue_daily_rate, overdue_cap_rate,
        overdue_lock_access_days, overdue_notice_days, overdue_termination_days,
        return_notice_days, return_refund_working_days, return_early_refund_rate,
        access_pin_length, support_urgent_sla_hours, support_auto_close_working_days,
        published_by
    )
    SELECT
        1, SYSDATETIMEOFFSET(), 1.0, 48,
        10, 48, 0.5, 0.0,
        '60,7,3,1', 1, 12,
        3, 0.1, 0.7,
        10, 4, 10,
        30, 7, 0.0,
        6, 2, 7,
        u.id
    FROM app_user u WHERE u.email = 'bom@storage.vn';
END
GO

PRINT N'-> Đã kiểm tra và seed policy_version.';

PRINT N'============================================================================';
PRINT N'ĐÃ SEED DỮ LIỆU THÀNH CÔNG! DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP (MẬT KHẨU: password123):';
PRINT N'1. Khách hàng: customer@storage.vn';
PRINT N'2. Nhân viên : staff@storage.vn';
PRINT N'3. Quản lý   : manager@storage.vn';
PRINT N'4. BOM       : bom@storage.vn';
PRINT N'5. Admin     : admin@storage.vn';
PRINT N'============================================================================';
GO
