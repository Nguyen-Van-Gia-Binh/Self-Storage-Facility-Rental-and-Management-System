/* ============================================================================
   Flyway Migration V28__clean_garbage_facility_sadas.sql
   Dọn dẹp cơ sở rác 'sadas' hoặc các cơ sở test không hợp lệ (Issue 25, SA-03, FM-01)
   Bảo vệ tính toàn vẹn dữ liệu multi-tenancy.
   ============================================================================ */

-- 1. Xóa các phân công liên quan đến cơ sở rác sadas
DELETE FROM user_facility_assignment 
WHERE facility_id IN (
    SELECT id FROM facility WHERE LOWER(code) LIKE '%sadas%' OR LOWER(name) LIKE '%sadas%'
);

-- 2. Xóa bảng giá liên quan nếu có
DELETE FROM facility_unit_type_price 
WHERE facility_id IN (
    SELECT id FROM facility WHERE LOWER(code) LIKE '%sadas%' OR LOWER(name) LIKE '%sadas%'
);

-- 3. Xóa các ô kho test rác nếu có
DELETE FROM storage_unit 
WHERE facility_id IN (
    SELECT id FROM facility WHERE LOWER(code) LIKE '%sadas%' OR LOWER(name) LIKE '%sadas%'
);

-- 4. Xóa bản ghi cơ sở rác sadas khỏi bảng facility
DELETE FROM facility 
WHERE LOWER(code) LIKE '%sadas%' OR LOWER(name) LIKE '%sadas%';
