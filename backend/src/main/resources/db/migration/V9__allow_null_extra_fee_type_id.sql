-- V9__allow_null_extra_fee_type_id.sql
-- Đồng bộ bảng contract_extra_charge theo đúng DATA-DICTIONARY.md (§ 4.6):
-- Cho phép extra_fee_type_id mang giá trị NULL đối với phụ phí bồi thường hư hại phát sinh đột xuất từ nghiệm thu trả kho (FS-04, BR-RET-04).

IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('contract_extra_charge') 
      AND name = 'extra_fee_type_id' 
      AND is_nullable = 0
)
BEGIN
    ALTER TABLE contract_extra_charge ALTER COLUMN extra_fee_type_id BIGINT NULL;
END
GO
