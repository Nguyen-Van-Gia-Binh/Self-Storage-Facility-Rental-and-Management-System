/* ============================================================================
   Flyway Migration V11__fix_seed_user_passwords.sql
   Cập nhật lại BCrypt password hash chuẩn cho các tài khoản mẫu:
   Password mặc định: password123
   BCrypt hash hợp lệ: $2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi
   ============================================================================ */

UPDATE app_user
SET password_hash = '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi'
WHERE email IN (
    'customer@storage.vn',
    'staff@storage.vn',
    'manager@storage.vn',
    'bom@storage.vn',
    'admin@storage.vn'
);
