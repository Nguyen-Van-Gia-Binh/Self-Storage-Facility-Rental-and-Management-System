-- ==============================================================================
-- Migration V44: Tự động hoàn tất các giao dịch bồi thường & hoàn tiền của hợp đồng đã duyệt quyết toán
-- ==============================================================================

-- Khi FM duyệt quyết toán hoặc kích hoạt bồi thường phạt cọc gấp đôi (BR-BMP-02),
-- các giao dịch hoàn tiền và đền bù được xem là đã giải ngân hoàn tất (SUCCESS).
UPDATE payment_transaction
SET status = 'SUCCESS',
    paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)
WHERE status = 'PENDING_REFUND';

-- Đồng bộ tổng số tiền bồi thường đầy đủ (Thuê + Cọc + Phạt cọc 2x) vào biên bản hoàn tất
UPDATE return_request
SET deposit_refund_amount = (
    SELECT rc.total_rental_fee + rc.deposit_amount + rc.compensation_amount
    FROM rental_contract rc
    WHERE rc.id = return_request.contract_id
)
WHERE contract_id IN (
    SELECT id FROM rental_contract WHERE is_double_deposit_compensation = TRUE
);
