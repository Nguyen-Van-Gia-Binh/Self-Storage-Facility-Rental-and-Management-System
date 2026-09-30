-- Cho phép monthly_price = 0 đối với loại ô kho mới tạo chờ BOM duyệt giá (Audit 22, FM-01, BM-02)
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'ck_facility_unit_type_price_monthly_price')
BEGIN
    ALTER TABLE facility_unit_type_price
        DROP CONSTRAINT ck_facility_unit_type_price_monthly_price;
END;
GO

ALTER TABLE facility_unit_type_price
    ADD CONSTRAINT ck_facility_unit_type_price_monthly_price
        CHECK (monthly_price >= 0);
GO

-- Tự động liên kết các loại ô kho mồ côi (chưa có giá) vào cơ sở mặc định (Cơ sở 1 - Cầu Giấy)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT 1, ut.id, 0
FROM unit_type ut
WHERE NOT EXISTS (
    SELECT 1 FROM facility_unit_type_price p WHERE p.unit_type_id = ut.id
);
GO
