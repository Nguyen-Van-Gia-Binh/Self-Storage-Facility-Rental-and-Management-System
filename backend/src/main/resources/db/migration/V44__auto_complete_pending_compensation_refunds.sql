-- ==============================================================================
-- Migration V44: Tự động hoàn tất các giao dịch bồi thường & hoàn tiền của hợp đồng đã duyệt quyết toán
-- ==============================================================================

-- Khi FM duyệt quyết toán hoặc kích hoạt bồi thường phạt cọc gấp đôi (BR-BMP-02),
-- các giao dịch hoàn tiền và đền bù được xem là đã giải ngân hoàn tất (SUCCESS).
UPDATE payment_transaction
SET status = 'SUCCESS',
    paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)
WHERE status = 'PENDING_REFUND';
