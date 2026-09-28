/* ============================================================================
   Flyway Migration V24__assign_demo_staff_and_manager_facilities.sql
   Đảm bảo Quản lý cơ sở (fm.q1) và Nhân viên (staff.q1, staff@storage.vn)
   được gán đầy đủ vào các cơ sở quản lý (FAC-CG - ID 1, FAC-Q7 - ID 2)
   để phục vụ điều phối và phân công nhiệm vụ (FM-05, T4.15).
   ============================================================================ */

-- 1. Gán Quản lý cơ sở fm.q1 vào FAC-CG (Cầu Giấy) và FAC-Q7 (Quận 7)
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u, facility f
WHERE u.email = 'fm.q1@smartstorage.vn'
  AND f.code IN ('FAC-CG', 'FAC-Q7')
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );

-- 2. Gán Nhân viên cơ sở staff.q1 vào FAC-CG (Cầu Giấy) và FAC-Q7 (Quận 7)
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u, facility f
WHERE u.email = 'staff.q1@smartstorage.vn'
  AND f.code IN ('FAC-CG', 'FAC-Q7')
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );

-- 3. Gán Nhân viên cơ sở staff@storage.vn vào FAC-CG nếu chưa có
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u, facility f
WHERE u.email = 'staff@storage.vn'
  AND f.code = 'FAC-CG'
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );
