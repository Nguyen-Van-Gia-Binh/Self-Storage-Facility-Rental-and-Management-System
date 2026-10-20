-- V34: đơn giá m² + lịch sử phiên bản giá (BM-03 / BR-GEN-05)
IF COL_LENGTH('facility_unit_type_price', 'price_per_m2') IS NULL
BEGIN
    ALTER TABLE facility_unit_type_price ADD price_per_m2 BIGINT NULL;
END;
GO

IF OBJECT_ID('facility_unit_type_price_version', 'U') IS NULL
BEGIN
    CREATE TABLE facility_unit_type_price_version (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        facility_id         BIGINT            NOT NULL,
        unit_type_id        BIGINT            NOT NULL,
        price_per_m2        BIGINT            NOT NULL,
        monthly_price       BIGINT            NOT NULL,
        effective_from      DATE              NOT NULL,
        created_at          DATETIMEOFFSET    NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT fk_futp_version_facility_id
            FOREIGN KEY (facility_id) REFERENCES facility(id),
        CONSTRAINT fk_futp_version_unit_type_id
            FOREIGN KEY (unit_type_id) REFERENCES unit_type(id),
        CONSTRAINT ck_futp_version_price_per_m2 CHECK (price_per_m2 > 0),
        CONSTRAINT ck_futp_version_monthly_price CHECK (monthly_price > 0)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'ix_futp_version_facility_unit_type_effective'
      AND object_id = OBJECT_ID('facility_unit_type_price_version')
)
BEGIN
    CREATE INDEX ix_futp_version_facility_unit_type_effective
        ON facility_unit_type_price_version (facility_id, unit_type_id, effective_from DESC, id DESC);
END;
GO
