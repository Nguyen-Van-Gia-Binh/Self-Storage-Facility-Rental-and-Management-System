-- ============================================================================
-- V26: Cập nhật tham số chính sách quá hạn sang chu kỳ 8 ngày khép kín
--      (15% lưu kho D+1..D+3 + 40% phạt D+4..D+7 + 45% phí niêm phong Kho Tổng = 100% cọc)
--      và rút ngắn khoảng đệm an toàn rental_buffer_days từ 15 ngày xuống 8 ngày.
-- ============================================================================

UPDATE policy_version
SET overdue_grace_days = 3,
    overdue_daily_rate = 0.10,
    overdue_cap_rate = 0.55,
    overdue_lock_access_days = 1,
    overdue_termination_days = 7,
    rental_buffer_days = 8;

ALTER TABLE policy_version ALTER COLUMN rental_buffer_days SET DEFAULT 8;
