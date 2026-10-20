-- V13__fix_all_demo_user_passwords.sql
-- Cập nhật đồng bộ BCrypt hash cho mật khẩu mặc định 'password123' cho tất cả các tài khoản demo

UPDATE app_user
SET password_hash = '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi'
WHERE email IN (
    'admin@smartstorage.vn',
    'bom@smartstorage.vn',
    'fm.q1@smartstorage.vn',
    'staff.q1@smartstorage.vn',
    'nhi.customer@gmail.com',
    'customer@storage.vn',
    'staff@storage.vn',
    'manager@storage.vn',
    'bom@storage.vn',
    'admin@storage.vn',
    'tung@gmail.com'
);
