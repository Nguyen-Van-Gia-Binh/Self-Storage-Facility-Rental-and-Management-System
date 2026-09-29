/* ============================================================================
   Flyway Migration V35__cleanup_orphan_facility_assignments.sql
   Dọn dẹp các bản ghi phân công mồ côi (orphan user_facility_assignment)
   thuộc các cơ sở đã ngừng hoạt động (INACTIVE) hoặc không còn tồn tại (SA-03, FM-01).
   ============================================================================ */

DELETE FROM user_facility_assignment
WHERE facility_id NOT IN (
    SELECT id FROM facility WHERE status = 'ACTIVE'
);
