-- Phụ phí theo cơ sở, loại FIXED/PERCENTAGE và ngày bắt đầu hiệu lực (BM-03)
IF COL_LENGTH('extra_fee_type', 'facility_id') IS NULL
BEGIN
    ALTER TABLE extra_fee_type ADD facility_id BIGINT NULL;
END;
GO

IF COL_LENGTH('extra_fee_type', 'fee_type') IS NULL
BEGIN
    ALTER TABLE extra_fee_type
        ADD fee_type VARCHAR(20) NOT NULL
            CONSTRAINT df_extra_fee_type_fee_type DEFAULT 'FIXED';
END;
GO

IF COL_LENGTH('extra_fee_type', 'effective_from') IS NULL
BEGIN
    ALTER TABLE extra_fee_type ADD effective_from DATE NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_extra_fee_type_facility')
BEGIN
    ALTER TABLE extra_fee_type
        ADD CONSTRAINT fk_extra_fee_type_facility
            FOREIGN KEY (facility_id) REFERENCES facility(id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_extra_fee_type_fee_type')
BEGIN
    ALTER TABLE extra_fee_type
        ADD CONSTRAINT ck_extra_fee_type_fee_type
            CHECK (fee_type IN ('FIXED', 'PERCENTAGE'));
END;
GO
