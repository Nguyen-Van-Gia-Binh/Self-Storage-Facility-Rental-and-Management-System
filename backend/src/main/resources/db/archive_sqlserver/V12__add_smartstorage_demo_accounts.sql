/* ============================================================================
   Flyway Migration V12__add_smartstorage_demo_accounts.sql
   Bổ sung các tài khoản mẫu khớp với giao diện đăng nhập nhanh (LoginPage):
   - admin@smartstorage.vn (Admin)
   - bom@smartstorage.vn (BOM)
   - fm.q1@smartstorage.vn (Quản lý cơ sở Cầu Giấy & Quận 7)
   - staff.q1@smartstorage.vn (Nhân viên cơ sở Cầu Giấy)
   - nhi.customer@gmail.com (Khách hàng thuê kho)

   Mật khẩu mặc định: password123
   BCrypt hash: $2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi
   ============================================================================ */

-- 1. Thêm tài khoản nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'admin@smartstorage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('admin@smartstorage.vn', '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', N'Lê Thanh Tùng', '0901234567', '079099001234', 'SYSTEM_ADMINISTRATOR', 'ACTIVE');
END;

IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'bom@smartstorage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('bom@smartstorage.vn', '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', N'Huỳnh Nhật', '0912345678', '079099002345', 'BUSINESS_OPERATIONS_MANAGER', 'ACTIVE');
END;

IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'fm.q1@smartstorage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('fm.q1@smartstorage.vn', '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', N'Nguyễn Văn Gia Bình', '0923456789', '079099003456', 'FACILITY_MANAGER', 'ACTIVE');
END;

IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'staff.q1@smartstorage.vn')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('staff.q1@smartstorage.vn', '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', N'Trần Văn Hùng', '0934567890', '079099004567', 'FACILITY_STAFF', 'ACTIVE');
END;

IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'nhi.customer@gmail.com')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('nhi.customer@gmail.com', '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', N'Nguyễn Phạm Xuân Nhi', '0967890123', '079099007890', 'STORAGE_CUSTOMER', 'ACTIVE');
END;

-- 2. Gán cơ sở cho Quản lý cơ sở và Nhân viên
-- fm.q1 được gán vào cơ sở Cầu Giấy (FAC-CG) và Quận 7 (FAC-Q7)
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id 
FROM app_user u, facility f 
WHERE u.email = 'fm.q1@smartstorage.vn' 
  AND f.code IN ('FAC-CG', 'FAC-Q7')
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );

-- staff.q1 được gán vào cơ sở Cầu Giấy (FAC-CG)
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id 
FROM app_user u, facility f 
WHERE u.email = 'staff.q1@smartstorage.vn' 
  AND f.code = 'FAC-CG'
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );
