-- V23__allow_overdue_penalty_in_payment_transaction.sql
-- Mở rộng ràng buộc ck_payment_transaction_type để hỗ trợ giao dịch đóng nợ phạt OVERDUE_PENALTY

IF EXISTS (
    SELECT 1 
    FROM sys.check_constraints 
    WHERE name = 'ck_payment_transaction_type' 
      AND parent_object_id = OBJECT_ID('payment_transaction')
)
BEGIN
    ALTER TABLE payment_transaction
    DROP CONSTRAINT ck_payment_transaction_type;
END
GO

ALTER TABLE payment_transaction
ADD CONSTRAINT ck_payment_transaction_type CHECK (
    transaction_type IN (
        'INITIAL_PAYMENT',
        'RENEWAL_PAYMENT',
        'CONTRACT_RENEWAL',
        'EXTRA_FEE_PAYMENT',
        'OVERDUE_PENALTY',
        'SETTLEMENT',
        'REFUND'
    )
);
GO
