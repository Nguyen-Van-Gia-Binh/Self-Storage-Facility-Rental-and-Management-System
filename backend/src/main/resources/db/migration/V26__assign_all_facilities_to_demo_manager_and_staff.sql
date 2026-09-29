/* ============================================================================
   Flyway Migration V26__assign_all_facilities_to_demo_manager_and_staff.sql
   Đảm bảo Quản lý cơ sở demo (fm.q1@smartstorage.vn) và Nhân viên demo
   (staff.q1@smartstorage.vn, staff@storage.vn) được gán quyền đầy đủ vào
   TẤT CẢ các cơ sở trong hệ thống (FAC-CG, FAC-Q7, FAC-HBT, FAC-TX, FAC-Q1,
   FAC-BT, FAC-TD...).
   Điều này đảm bảo khi người dùng tạo đơn ở bất kỳ cơ sở nào (HBT, BT, TD, TX...),
   Quản lý cơ sở và Nhân viên đều có quyền RBAC để giám sát và tiếp đón.
   ============================================================================ */

-- 1. Gán toàn bộ cơ sở cho Quản lý fm.q1@smartstorage.vn
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u
CROSS JOIN facility f
WHERE u.email = 'fm.q1@smartstorage.vn'
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa 
      WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );

-- 2. Gán toàn bộ cơ sở cho Nhân viên staff.q1@smartstorage.vn
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u
CROSS JOIN facility f
WHERE u.email = 'staff.q1@smartstorage.vn'
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa 
      WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );

-- 3. Gán toàn bộ cơ sở cho Nhân viên staff@storage.vn
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u
CROSS JOIN facility f
WHERE u.email = 'staff@storage.vn'
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa 
      WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );
