-- Bốn nhóm phụ phí (BR-PRI-04). Số tiền vẫn do BOM nhập, không seed mức phí.
IF COL_LENGTH('extra_fee_type', 'category') IS NULL
BEGIN
    ALTER TABLE extra_fee_type ADD category VARCHAR(30) NULL;
END;
GO

UPDATE extra_fee_type SET category = 'VALUE_ADDED' WHERE category IS NULL;
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('extra_fee_type')
      AND name = 'category'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE extra_fee_type ALTER COLUMN category VARCHAR(30) NOT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_extra_fee_type_category')
BEGIN
    ALTER TABLE extra_fee_type
        ADD CONSTRAINT ck_extra_fee_type_category
            CHECK (category IN ('ACCESS_KEY', 'CLEANING', 'DAMAGE', 'VALUE_ADDED'));
END;
GO

IF OBJECT_ID('extra_fee_version', 'U') IS NOT NULL
   AND COL_LENGTH('extra_fee_version', 'category') IS NULL
BEGIN
    ALTER TABLE extra_fee_version ADD category VARCHAR(30) NULL;
END;
GO

IF OBJECT_ID('extra_fee_version', 'U') IS NOT NULL
BEGIN
    UPDATE extra_fee_version SET category = 'VALUE_ADDED' WHERE category IS NULL;
END;
GO

IF OBJECT_ID('extra_fee_version', 'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('extra_fee_version')
          AND name = 'category'
          AND is_nullable = 1
   )
BEGIN
    ALTER TABLE extra_fee_version ALTER COLUMN category VARCHAR(30) NOT NULL;
END;
GO

IF OBJECT_ID('extra_fee_version', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_extra_fee_version_category')
BEGIN
    ALTER TABLE extra_fee_version
        ADD CONSTRAINT ck_extra_fee_version_category
            CHECK (category IN ('ACCESS_KEY', 'CLEANING', 'DAMAGE', 'VALUE_ADDED'));
END;
GO
