-- V54__add_min_rental_months_and_seed_discount_programs.sql
-- Bổ sung điều kiện số tháng thuê tối thiểu và seed 2 chương trình ưu đãi chuẩn theo BR-PRI-01

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('discount_program') AND name = 'min_rental_months'
)
BEGIN
    ALTER TABLE discount_program
    ADD min_rental_months INT NOT NULL CONSTRAINT df_discount_program_min_months DEFAULT 1;

    ALTER TABLE discount_program
    ADD CONSTRAINT ck_discount_program_min_months CHECK (min_rental_months >= 1);
END;

-- Seed 2 chương trình khuyến mãi mặc định toàn hệ thống để tương thích ngược 100%
IF NOT EXISTS (SELECT 1 FROM discount_program WHERE name = N'Ưu đãi thuê từ 6 tháng (5%)')
BEGIN
    INSERT INTO discount_program (
        name, discount_type, discount_value, min_rental_months,
        start_date, end_date, scope_type, is_active, created_at, updated_at
    )
    VALUES (
        N'Ưu đãi thuê từ 6 tháng (5%)', 'PERCENT', 5.00, 6,
        '2026-01-01', '2026-12-31', 'SYSTEM', 1, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    );
END;

IF NOT EXISTS (SELECT 1 FROM discount_program WHERE name = N'Ưu đãi thuê dài hạn từ 12 tháng (10%)')
BEGIN
    INSERT INTO discount_program (
        name, discount_type, discount_value, min_rental_months,
        start_date, end_date, scope_type, is_active, created_at, updated_at
    )
    VALUES (
        N'Ưu đãi thuê dài hạn từ 12 tháng (10%)', 'PERCENT', 10.00, 12,
        '2026-01-01', '2026-12-31', 'SYSTEM', 1, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    );
END;
