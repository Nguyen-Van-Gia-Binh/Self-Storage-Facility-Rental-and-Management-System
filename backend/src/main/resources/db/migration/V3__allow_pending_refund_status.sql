-- ============================================================================
-- Migration: V3__allow_pending_refund_status.sql
-- Description: Bổ sung trạng thái 'PENDING_REFUND' vào ràng buộc ck_payment_transaction_status
--              phục vụ lưu vết giao dịch hoàn tiền khi hủy nhận kho (BR-CAN-01) và trả kho (BR-RET-05).
-- ============================================================================

ALTER TABLE payment_transaction
    DROP CONSTRAINT IF EXISTS ck_payment_transaction_status,
    ADD CONSTRAINT ck_payment_transaction_status CHECK (
        status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUND_FAILED', 'PENDING_REFUND')
    );
