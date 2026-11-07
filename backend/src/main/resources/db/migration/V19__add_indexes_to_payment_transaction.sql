-- ============================================================================
-- Self-Storage Facility Rental and Management System
-- Flyway Migration: V19__add_indexes_to_payment_transaction.sql
-- Database: PostgreSQL 16+
-- Tối ưu hóa hiệu năng truy vấn cho bảng payment_transaction (Polling & Cronjob)
-- ============================================================================

-- 1. Unique Index trên order_code (tăng tốc Polling, IPN Webhook và chống tạo trùng đơn)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transaction_order_code 
    ON payment_transaction(order_code) 
    WHERE order_code IS NOT NULL;

-- 2. Composite Index trên (status, created_at) (tối ưu hóa Cronjob quét đối soát đơn PENDING)
CREATE INDEX IF NOT EXISTS idx_payment_transaction_status_created_at 
    ON payment_transaction(status, created_at);

