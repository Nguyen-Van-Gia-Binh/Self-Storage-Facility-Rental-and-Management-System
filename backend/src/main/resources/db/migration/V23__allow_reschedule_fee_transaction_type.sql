-- BR-RES-06: cho phép loại giao dịch RESCHEDULE_FEE (phí dời ngày nhận kho thanh toán qua VNPay Sandbox).
-- Ràng buộc gốc ở V1 chỉ chấp nhận 6 loại nên insert RESCHEDULE_FEE bị từ chối (ck_payment_transaction_type).
ALTER TABLE payment_transaction DROP CONSTRAINT IF EXISTS ck_payment_transaction_type;

ALTER TABLE payment_transaction
    ADD CONSTRAINT ck_payment_transaction_type CHECK (transaction_type IN (
        'INITIAL_PAYMENT',
        'RENEWAL_PAYMENT',
        'EXTRA_FEE_PAYMENT',
        'REFUND',
        'CONTRACT_RENEWAL',
        'OVERDUE_PENALTY',
        'RESCHEDULE_FEE'
    ));

