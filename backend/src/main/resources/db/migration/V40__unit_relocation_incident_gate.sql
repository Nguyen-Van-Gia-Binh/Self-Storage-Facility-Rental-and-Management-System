-- Đổi ô kho chỉ khi có phiếu hư hỏng: cờ cần di dời, thông báo cho khách, và mã phiếu trên hợp đồng
IF COL_LENGTH('support_request', 'relocation_required') IS NULL
BEGIN
    ALTER TABLE support_request ADD relocation_required BIT NOT NULL CONSTRAINT df_support_request_relocation_required DEFAULT 0;
END;
GO

IF COL_LENGTH('support_request', 'customer_notice') IS NULL
BEGIN
    ALTER TABLE support_request ADD customer_notice NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH('rental_contract', 'relocation_support_request_id') IS NULL
BEGIN
    ALTER TABLE rental_contract ADD relocation_support_request_id BIGINT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_rental_contract_relocation_support')
BEGIN
    ALTER TABLE rental_contract
        ADD CONSTRAINT fk_rental_contract_relocation_support
            FOREIGN KEY (relocation_support_request_id) REFERENCES support_request(id);
END;
GO
