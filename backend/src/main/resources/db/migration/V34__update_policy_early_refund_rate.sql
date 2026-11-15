-- V34__update_policy_early_refund_rate.sql
-- Cập nhật return_early_refund_rate thành 1.00 (100%) theo chuẩn BR-RET-06 (Chính sách Trả kho sớm Win-Win)

UPDATE policy_version
SET return_early_refund_rate = 1.00
WHERE return_early_refund_rate = 0.00 OR return_early_refund_rate IS NULL;
