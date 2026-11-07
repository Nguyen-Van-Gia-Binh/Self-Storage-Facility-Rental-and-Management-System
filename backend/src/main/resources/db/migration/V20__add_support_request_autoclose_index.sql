-- ============================================================================
-- Self-Storage Facility Rental and Management System
-- Flyway Migration: V20__add_support_request_autoclose_index.sql
-- Database: PostgreSQL 16+
-- Tối ưu hóa hiệu năng truy vấn cho Cronjob tự đóng phiếu hỗ trợ (SupportAutoCloseJob)
-- ============================================================================

-- Composite Index trên (status, resolved_at) tăng tốc quét và cập nhật các ticket RESOLVED
CREATE INDEX IF NOT EXISTS idx_support_request_status_resolved_at
    ON support_request(status, resolved_at);

