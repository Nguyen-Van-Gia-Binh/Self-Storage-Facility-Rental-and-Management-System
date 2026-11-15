-- V35__update_policy_cancel_late_refund_rate.sql
-- Cập nhật cancel_late_refund_rate thành 0.00 (Phạt 100% cọc) theo đúng chuẩn BR-CAN-03 (< 48h trước ngày bắt đầu)
-- Chuẩn hóa cancel_mid_refund_rate = 0.50 (Phạt 50% cọc) theo BR-CAN-02 (2-6 ngày)
-- Chuẩn hóa cancel_full_refund_days = 7 (Hoàn 100% cọc) theo BR-CAN-01 (>= 7 ngày)

UPDATE policy_version
SET cancel_late_refund_rate = 0.00
WHERE cancel_late_refund_rate != 0.00 OR cancel_late_refund_rate IS NULL;

UPDATE policy_version
SET cancel_mid_refund_rate = 0.50
WHERE cancel_mid_refund_rate IS NULL;

UPDATE policy_version
SET cancel_full_refund_days = 7
WHERE cancel_full_refund_days IS NULL;
