-- ============================================================================
-- V41__upgrade_enterprise_discount_programs.sql
-- Chuẩn hóa danh mục Chương trình Khuyến mãi & Chiết khấu theo chuẩn Doanh nghiệp B2B
-- đồng bộ với thang diện tích 5-100 m² & bảng giá V39 (1.2tr - 27.6tr/tháng):
--   - Bậc chiết khấu kỳ hạn toàn hệ thống: ≥6 tháng (5%), ≥12 tháng (10%), ≥24 tháng (15%)
--   - Ưu đãi theo loại kho lớn: UT-AC-L 60m² (8%), UT-STD-XL 100m² (12%)
--   - Ưu đãi hỗ trợ vận chuyển/nhập kho theo cơ sở: FAC-CG (-1.0tr), FAC-BN (-1.5tr), FAC-Q1 (-2.0tr, tạm dừng)
--   - Bảo toàn IDs 1..4 (ON CONFLICT (id) DO UPDATE) và soft-disable dòng ngoài danh mục chuẩn
-- ============================================================================

UPDATE discount_program
SET is_active  = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE id NOT BETWEEN 1 AND 8
  AND is_active = TRUE;

INSERT INTO discount_program (
    id, name, discount_type, discount_value,
    min_rental_months, start_date, end_date,
    scope_type, facility_id, unit_type_id, is_active
)
VALUES
(
    1,
    'Ưu đãi hợp đồng doanh nghiệp từ 6 tháng (5%)',
    'PERCENT', 5.00, 6, '2026-01-01', '2027-12-31',
    'SYSTEM', NULL, NULL, TRUE
),
(
    2,
    'Chiết khấu hợp đồng năm doanh nghiệp từ 12 tháng (10%)',
    'PERCENT', 10.00, 12, '2026-01-01', '2027-12-31',
    'SYSTEM', NULL, NULL, TRUE
),
(
    3,
    'Hỗ trợ chi phí vận chuyển & nhập kho Cơ sở Cầu Giấy',
    'AMOUNT', 1000000.00, 3, '2026-10-01', '2027-06-30',
    'FACILITY',
    COALESCE((SELECT id FROM facility WHERE code = 'FAC-CG' LIMIT 1), 1),
    NULL, TRUE
),
(
    4,
    'Ưu đãi hợp đồng Kho Máy Lạnh cỡ L (60 m²)',
    'PERCENT', 8.00, 6, '2026-10-01', '2027-12-31',
    'UNIT_TYPE',
    NULL,
    COALESCE((SELECT id FROM unit_type WHERE code = 'UT-AC-L' LIMIT 1), 6),
    TRUE
),
(
    5,
    'Chiết khấu đối tác chiến lược dài hạn từ 24 tháng (15%)',
    'PERCENT', 15.00, 24, '2026-01-01', '2027-12-31',
    'SYSTEM', NULL, NULL, TRUE
),
(
    6,
    'Ưu đãi tổng kho phân phối cỡ XL (100 m²)',
    'PERCENT', 12.00, 6, '2026-10-01', '2027-12-31',
    'UNIT_TYPE',
    NULL,
    COALESCE((SELECT id FROM unit_type WHERE code = 'UT-STD-XL' LIMIT 1), 8),
    TRUE
),
(
    7,
    'Ưu đãi thuê kho logistics KCN Yên Phong - Bắc Ninh',
    'AMOUNT', 1500000.00, 3, '2026-10-01', '2027-06-30',
    'FACILITY',
    COALESCE((SELECT id FROM facility WHERE code = 'FAC-BN' LIMIT 1), 10),
    NULL, TRUE
),
(
    8,
    'Ưu đãi khai trương khu kho lạnh Cơ sở Quận 1',
    'AMOUNT', 2000000.00, 6, '2026-11-01', '2027-03-31',
    'FACILITY',
    COALESCE((SELECT id FROM facility WHERE code = 'FAC-Q1' LIMIT 1), 5),
    NULL, FALSE
)
ON CONFLICT (id) DO UPDATE SET
    name              = EXCLUDED.name,
    discount_type     = EXCLUDED.discount_type,
    discount_value    = EXCLUDED.discount_value,
    min_rental_months = EXCLUDED.min_rental_months,
    start_date        = EXCLUDED.start_date,
    end_date          = EXCLUDED.end_date,
    scope_type        = EXCLUDED.scope_type,
    facility_id       = EXCLUDED.facility_id,
    unit_type_id      = EXCLUDED.unit_type_id,
    is_active         = EXCLUDED.is_active,
    updated_at        = CURRENT_TIMESTAMP;

SELECT setval(
    pg_get_serial_sequence('discount_program', 'id'),
    COALESCE((SELECT MAX(id) FROM discount_program), 8)
);
