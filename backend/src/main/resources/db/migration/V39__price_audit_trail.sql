-- Nhật ký phiên bản giá: người ban hành trên giá thuê, và lịch sử phụ phí không bị ghi đè (BM-03)
IF COL_LENGTH('facility_unit_type_price_version', 'created_by') IS NULL
BEGIN
    ALTER TABLE facility_unit_type_price_version ADD created_by BIGINT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_futp_version_created_by')
BEGIN
    ALTER TABLE facility_unit_type_price_version
        ADD CONSTRAINT fk_futp_version_created_by
            FOREIGN KEY (created_by) REFERENCES app_user(id);
END;
GO

IF OBJECT_ID('extra_fee_version', 'U') IS NULL
BEGIN
    CREATE TABLE extra_fee_version (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        extra_fee_type_id   BIGINT            NOT NULL,
        code                NVARCHAR(30)      NOT NULL,
        name                NVARCHAR(150)     NOT NULL,
        facility_id         BIGINT            NULL,
        amount              BIGINT            NOT NULL,
        fee_type            VARCHAR(20)       NOT NULL,
        is_active           BIT               NOT NULL,
        effective_from      DATE              NULL,
        created_by          BIGINT            NULL,
        created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT fk_extra_fee_version_type
            FOREIGN KEY (extra_fee_type_id) REFERENCES extra_fee_type(id),
        CONSTRAINT fk_extra_fee_version_facility
            FOREIGN KEY (facility_id) REFERENCES facility(id),
        CONSTRAINT fk_extra_fee_version_created_by
            FOREIGN KEY (created_by) REFERENCES app_user(id),
        CONSTRAINT ck_extra_fee_version_amount CHECK (amount >= 0),
        CONSTRAINT ck_extra_fee_version_fee_type CHECK (fee_type IN ('FIXED', 'PERCENTAGE'))
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ix_extra_fee_version_type_created'
      AND object_id = OBJECT_ID('extra_fee_version')
)
BEGIN
    CREATE INDEX ix_extra_fee_version_type_created
        ON extra_fee_version (extra_fee_type_id, created_at, id);
END;
GO

INSERT INTO extra_fee_version (
    extra_fee_type_id, code, name, facility_id, amount, fee_type, is_active, effective_from, created_by, created_at
)
SELECT
    e.id,
    e.code,
    e.name,
    e.facility_id,
    e.amount,
    ISNULL(e.fee_type, 'FIXED'),
    e.is_active,
    e.effective_from,
    NULL,
    e.created_at
FROM extra_fee_type e
WHERE NOT EXISTS (
    SELECT 1 FROM extra_fee_version v WHERE v.extra_fee_type_id = e.id
);
GO
