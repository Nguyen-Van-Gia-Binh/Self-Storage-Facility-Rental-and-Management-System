-- V16__add_order_code_to_payment_transaction.sql
-- Bổ sung trường order_code lưu mã đơn hàng cổng thanh toán PayOS (số nguyên duy nhất)

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('payment_transaction') 
      AND name = 'order_code'
)
BEGIN
    ALTER TABLE payment_transaction
    ADD order_code BIGINT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE name = 'uq_payment_transaction_order_code' 
      AND object_id = OBJECT_ID('payment_transaction')
)
BEGIN
    CREATE UNIQUE INDEX uq_payment_transaction_order_code
    ON payment_transaction(order_code)
    WHERE order_code IS NOT NULL;
END
GO
