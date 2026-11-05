-- ============================================================================
-- Self-Storage Facility Rental and Management System
-- Flyway Migration: V8__add_performance_indexes.sql
-- Database: PostgreSQL 16+
-- Tối ưu hóa hiệu năng truy vấn cho các bảng nghiệp vụ chính
-- ============================================================================

-- 1. Chỉ mục cho rental_contract (giảm thiểu Seq Scan khi lọc theo cơ sở và trạng thái)
CREATE INDEX IF NOT EXISTS ix_rental_contract_facility_id 
    ON rental_contract(facility_id);

CREATE INDEX IF NOT EXISTS ix_rental_contract_facility_status 
    ON rental_contract(facility_id, status);

CREATE INDEX IF NOT EXISTS ix_rental_contract_facility_dates 
    ON rental_contract(facility_id, start_date, end_date);

-- 2. Chỉ mục cho storage_unit (hỗ trợ lọc sơ đồ kho và trạng thái sẵn sàng)
CREATE INDEX IF NOT EXISTS ix_storage_unit_facility_status 
    ON storage_unit(facility_id, status);

CREATE INDEX IF NOT EXISTS ix_storage_unit_facility_type 
    ON storage_unit(facility_id, unit_type_id);

-- 3. Chỉ mục cho return_request (tối ưu hóa tra cứu phiếu trả kho mới nhất của hợp đồng)
CREATE INDEX IF NOT EXISTS ix_return_request_contract_created 
    ON return_request(contract_id, created_at DESC);

-- 4. Chỉ mục cho staff_daily_assignment (tra cứu phân công theo loại nghiệp vụ và ID tham chiếu)
CREATE INDEX IF NOT EXISTS ix_staff_assignment_ref_type_id 
    ON staff_daily_assignment(reference_type, reference_id);

