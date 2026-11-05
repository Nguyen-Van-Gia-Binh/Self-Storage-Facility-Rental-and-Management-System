-- ==============================================================================
-- Migration V12: Bổ sung bộ đếm hủy đơn chống Spam Bom hàng (BR-SPAM-01)
-- ==============================================================================

ALTER TABLE app_user ADD COLUMN IF NOT EXISTS daily_cancel_count INT DEFAULT 0;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS last_cancel_date DATE;
