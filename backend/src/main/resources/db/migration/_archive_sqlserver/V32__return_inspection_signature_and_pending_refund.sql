-- V32__return_inspection_signature_and_pending_refund.sql
-- Lưu xác nhận khách trên biên bản trả kho (BR-RET-08) và cho phép ghi hoàn cọc PENDING_REFUND (BR-RET-05).

IF COL_LENGTH('return_request', 'customer_confirmed') IS NULL
BEGIN
    ALTER TABLE return_request
    ADD customer_confirmed BIT NOT NULL
        CONSTRAINT df_return_request_customer_confirmed DEFAULT 0;
END
GO

IF COL_LENGTH('return_request', 'customer_confirmed_at') IS NULL
BEGIN
    ALTER TABLE return_request ADD customer_confirmed_at DATETIMEOFFSET NULL;
END
GO

IF COL_LENGTH('return_request', 'signature_data') IS NULL
BEGIN
    ALTER TABLE return_request ADD signature_data NVARCHAR(MAX) NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'ck_payment_transaction_status'
      AND parent_object_id = OBJECT_ID('payment_transaction')
)
BEGIN
    ALTER TABLE payment_transaction DROP CONSTRAINT ck_payment_transaction_status;
END
GO

ALTER TABLE payment_transaction
ADD CONSTRAINT ck_payment_transaction_status CHECK (
    status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUND_FAILED', 'PENDING_REFUND')
);
GO
