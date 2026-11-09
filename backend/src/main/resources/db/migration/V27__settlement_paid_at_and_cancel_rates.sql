-- SETTLEMENT bị CHECK cũ từ chối. Liệt kê đủ loại giao dịch Java đang ghi.
-- paid_at là ngày tiền tới, không phải ngày tạo checkout.
-- cancel_full_refund_days / cancel_mid_refund_rate là khóa BR-CAN-01/02; trước đó schema chỉ có giờ.

ALTER TABLE payment_transaction DROP CONSTRAINT IF EXISTS ck_payment_transaction_type;

ALTER TABLE payment_transaction
    ADD CONSTRAINT ck_payment_transaction_type CHECK (transaction_type IN (
        'INITIAL_PAYMENT',
        'RENEWAL_PAYMENT',
        'EXTRA_FEE_PAYMENT',
        'REFUND',
        'RENT_REFUND',
        'DEPOSIT_REFUND',
        'CONTRACT_RENEWAL',
        'OVERDUE_PENALTY',
        'RESCHEDULE_FEE',
        'SETTLEMENT'
    ));

ALTER TABLE payment_transaction ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ NULL;

ALTER TABLE policy_version ADD COLUMN IF NOT EXISTS cancel_full_refund_days INT NOT NULL DEFAULT 7;
ALTER TABLE policy_version ADD COLUMN IF NOT EXISTS cancel_mid_refund_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.50;
