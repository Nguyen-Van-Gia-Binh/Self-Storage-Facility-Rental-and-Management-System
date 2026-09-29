-- V29__store_renewal_months_on_payment.sql
-- Lưu số tháng gia hạn đã chốt lúc tạo thanh toán, và gắn mỗi lần gia hạn với đúng một giao dịch
-- để không cộng end_date_exclusive lần thứ hai.

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('payment_transaction')
      AND name = 'renewal_months'
)
BEGIN
    ALTER TABLE payment_transaction
    ADD renewal_months INT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'ck_payment_transaction_renewal_months'
      AND parent_object_id = OBJECT_ID('payment_transaction')
)
BEGIN
    ALTER TABLE payment_transaction
    ADD CONSTRAINT ck_payment_transaction_renewal_months
        CHECK (renewal_months IS NULL OR renewal_months > 0);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('contract_renewal')
      AND name = 'payment_transaction_id'
)
BEGIN
    ALTER TABLE contract_renewal
    ADD payment_transaction_id BIGINT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'fk_contract_renewal_payment_transaction_id'
      AND parent_object_id = OBJECT_ID('contract_renewal')
)
BEGIN
    ALTER TABLE contract_renewal
    ADD CONSTRAINT fk_contract_renewal_payment_transaction_id
        FOREIGN KEY (payment_transaction_id) REFERENCES payment_transaction(id);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'uq_contract_renewal_payment_transaction_id'
      AND object_id = OBJECT_ID('contract_renewal')
)
BEGIN
    CREATE UNIQUE INDEX uq_contract_renewal_payment_transaction_id
    ON contract_renewal(payment_transaction_id)
    WHERE payment_transaction_id IS NOT NULL;
END
GO
