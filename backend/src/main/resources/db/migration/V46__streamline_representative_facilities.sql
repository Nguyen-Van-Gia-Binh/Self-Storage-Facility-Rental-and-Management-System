-- ============================================================================
-- V46__streamline_representative_facilities.sql
-- Tinh gọn danh mục cơ sở lưu trữ: Chỉ giữ lại 6 cơ sở chiến lược tiêu biểu
-- 1. Bắc Bộ:
--    - FAC-CG (ID 1):  Cơ sở Cầu Giấy - Hà Nội (Flagship Tây Hà Nội)
--    - FAC-HA (ID 8):  Cơ sở Hà Đông - Hà Nội (Hub Vệ tinh Tây Nam Hà Nội)
--    - FAC-BN (ID 10): Cơ sở KCN Yên Phong - Bắc Ninh (Hub Logistics B2B Công nghệ cao)
-- 2. Trung Bộ:
--    - FAC-DN (ID 11): Cơ sở Hải Châu - Đà Nẵng (Flagship Miền Trung)
-- 3. Nam Bộ:
--    - FAC-Q1 (ID 5):  Cơ sở Quận 1 - TP.HCM (Flagship Lõi Trung tâm Tài chính)
--    - FAC-Q7 (ID 2):  Cơ sở Quận 7 - TP.HCM (Flagship Nam Sài Gòn & Phú Mỹ Hưng)
-- ============================================================================

-- 1. Chuyển hợp đồng và giữ chỗ đã đóng/hủy từ cơ sở test rác (FAC-ATC, ID 17) về Cơ sở Quận 7 (ID 2)
UPDATE rental_contract
SET facility_id = 2,
    storage_unit_id = 13
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

UPDATE reservation
SET facility_id = 2,
    storage_unit_id = 13
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11)
   OR storage_unit_id IN (SELECT id FROM storage_unit WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11));

-- 2. Dọn dẹp các bản ghi liên kết ô kho của các cơ sở không thuộc danh sách tiêu biểu
DELETE FROM support_request
WHERE storage_unit_id IN (SELECT id FROM storage_unit WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11));

DELETE FROM access_credential
WHERE storage_unit_id IN (SELECT id FROM storage_unit WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11));

DELETE FROM access_log
WHERE storage_unit_id IN (SELECT id FROM storage_unit WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11));

DELETE FROM storage_unit
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

-- 3. Dọn dẹp các cấu hình, bảng giá và phân quyền của các cơ sở không thuộc danh sách tiêu biểu
DELETE FROM user_facility_assignment
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

DELETE FROM staff_daily_assignment
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

DELETE FROM facility_unit_type_price_version
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

DELETE FROM facility_unit_type_price
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

DELETE FROM discount_program
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

DELETE FROM waitlist
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

DELETE FROM audit_log
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

DELETE FROM extra_fee_version
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

DELETE FROM extra_fee_type
WHERE facility_id NOT IN (1, 2, 5, 8, 10, 11);

-- 4. Xóa các cơ sở ngoài danh mục tiêu biểu (FAC-HBT, FAC-TX, FAC-TD, FAC-BT, FAC-HP, FAC-KH, FAC-NA, FAC-BD, FAC-CT, FAC-PY1, FAC-ATC)
DELETE FROM facility
WHERE id NOT IN (1, 2, 5, 8, 10, 11);

-- 5. Kích hoạt toàn bộ 6 cơ sở tiêu biểu sang trạng thái ACTIVE và chuẩn hóa thông tin liên hệ
UPDATE facility
SET status = 'ACTIVE'
WHERE id IN (1, 2, 5, 8, 10, 11);

UPDATE facility
SET phone = '0236-388-7766'
WHERE id = 11 AND code = 'FAC-DN';

-- 6. Đảm bảo các tài khoản Quản lý (FM) và Nhân viên (Staff) demo được gán quyền đầy đủ vào cả 6 cơ sở tiêu biểu
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u, facility f
WHERE u.email IN ('manager@storage.vn', 'fm.q1@smartstorage.vn', 'staff@storage.vn', 'staff.q1@smartstorage.vn')
  AND f.id IN (1, 2, 5, 8, 10, 11)
ON CONFLICT (user_id, facility_id) DO NOTHING;
