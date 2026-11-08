-- ==============================================================================
-- Migration V21: Bổ sung cột rescheduled_start_date cho payment_transaction (BR-RES-06)
-- Phục vụ luồng thanh toán phí dời ngày nhận kho qua VNPay Sandbox
-- ==============================================================================

ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS rescheduled_start_date DATE NULL;
