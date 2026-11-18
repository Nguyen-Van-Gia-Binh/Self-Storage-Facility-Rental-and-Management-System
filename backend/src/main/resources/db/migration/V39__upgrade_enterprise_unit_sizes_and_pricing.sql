-- ============================================================================
-- V39__upgrade_enterprise_unit_sizes_and_pricing.sql
-- Nâng cấp toàn bộ danh mục Loại Ô Kho & Bảng Giá Thuê lên chuẩn Doanh Nghiệp Lớn (Enterprise B2B):
--   1. Thang diện tích chuẩn B2B (5 hạng × 2 môi trường = 10 loại):
--        XS: 5 m² (2.0 × 2.5 × 3.0m)   |  S: 15 m² (3.0 × 5.0 × 3.5m)
--        M:  30 m² (5.0 × 6.0 × 4.0m)  |  L: 60 m² (6.0 × 10.0 × 4.5m)
--        XL: 100 m² (10.0 × 10.0 × 5.0m)
--   2. Mặt bằng đơn giá B2B giảm dần theo quy mô (VND/m²/tháng):
--        Tiêu chuẩn (STD): 240k -> 220k -> 200k -> 180k -> 160k / m²
--        Máy lạnh (AC):    340k -> 310k -> 290k -> 260k -> 240k / m²
--   3. Phân bậc theo vị trí cơ sở (làm tròn đơn giá m² đến 1.000đ):
--        - Trung tâm Hạng A (×1.15): FAC-Q1, FAC-HBT
--        - Nội đô trung tâm (×1.00): FAC-CG, FAC-Q7, FAC-TX, FAC-BT, FAC-TD, FAC-HA
--        - KCN & Tỉnh thành (×0.90): các cơ sở còn lại
--   4. Bảo toàn tuyệt đối snapshot giá của các hợp đồng & đặt chỗ đã ký (BR-PRI-01).
-- ============================================================================

-- 1. Cập nhật kích thước & mô tả chuẩn B2B cho 10 loại ô kho (IDs 1..10)
INSERT INTO unit_type (id, code, name, width_m, length_m, height_m, environment, description, is_active)
VALUES
(7,  'UT-STD-XS', 'Kho Tiêu Chuẩn XS',  2.00,  2.50, 3.00, 'STANDARD',           'Kho doanh nghiệp cỡ XS (5 m² · 15 m³). Phù hợp lưu hồ sơ chứng từ, vật tư sự kiện, hàng thương mại điện tử gọn nhẹ (2-3 pallet).', TRUE),
(1,  'UT-STD-S',  'Kho Tiêu Chuẩn S',   3.00,  5.00, 3.50, 'STANDARD',           'Kho doanh nghiệp cỡ S (15 m² · 52.5 m³). Phù hợp lưu kho cửa hàng bán lẻ, vật tư quảng cáo, thiết bị văn phòng (6-8 pallet).', TRUE),
(2,  'UT-STD-M',  'Kho Tiêu Chuẩn M',   5.00,  6.00, 4.00, 'STANDARD',           'Kho doanh nghiệp cỡ M (30 m² · 120 m³). Phù hợp trung chuyển hàng thương mại điện tử, tồn kho đại lý phân phối (12-16 pallet).', TRUE),
(3,  'UT-STD-L',  'Kho Tiêu Chuẩn L',   6.00, 10.00, 4.50, 'STANDARD',           'Kho doanh nghiệp cỡ L (60 m² · 270 m³). Phù hợp kho vùng doanh nghiệp vừa, máy móc thiết bị công nghiệp nhẹ (25-32 pallet).', TRUE),
(8,  'UT-STD-XL', 'Kho Tiêu Chuẩn XL', 10.00, 10.00, 5.00, 'STANDARD',           'Tổng kho tiêu chuẩn cỡ XL (100 m² · 500 m³). Phù hợp kho phân phối doanh nghiệp lớn, hàng nhập khẩu nguyên kiện, xe nâng tiếp cận trực tiếp.', TRUE),
(9,  'UT-AC-XS',  'Kho Máy Lạnh XS',    2.00,  2.50, 3.00, 'CLIMATE_CONTROLLED', 'Kho điều hòa nhiệt ẩm 24/7 cỡ XS (5 m² · 15 m³ · 20°C-25°C). Phù hợp hồ sơ mật, thiết bị điện tử chính xác, mẫu vật giá trị cao.', TRUE),
(4,  'UT-AC-S',   'Kho Máy Lạnh S',     3.00,  5.00, 3.50, 'CLIMATE_CONTROLLED', 'Kho điều hòa nhiệt ẩm 24/7 cỡ S (15 m² · 52.5 m³ · 20°C-25°C). Phù hợp mỹ phẩm cao cấp, linh kiện điện tử, rượu vang & thời trang hàng hiệu.', TRUE),
(5,  'UT-AC-M',   'Kho Máy Lạnh M',     5.00,  6.00, 4.00, 'CLIMATE_CONTROLLED', 'Kho điều hòa nhiệt ẩm 24/7 cỡ M (30 m² · 120 m³ · 20°C-25°C). Phù hợp thực phẩm chức năng, thiết bị y tế, hàng phân phối chuỗi bán lẻ.', TRUE),
(6,  'UT-AC-L',   'Kho Máy Lạnh L',     6.00, 10.00, 4.50, 'CLIMATE_CONTROLLED', 'Kho điều hòa nhiệt ẩm 24/7 cỡ L (60 m² · 270 m³ · 20°C-25°C). Phù hợp kho dược phẩm đạt chuẩn, linh kiện bán dẫn, hàng xa xỉ phẩm.', TRUE),
(10, 'UT-AC-XL',  'Kho Máy Lạnh XL',   10.00, 10.00, 5.00, 'CLIMATE_CONTROLLED', 'Tổng kho lạnh thương mại 24/7 cỡ XL (100 m² · 500 m³ · 20°C-25°C). Phù hợp chuỗi phân phối dược phẩm, mỹ phẩm và logistics lạnh doanh nghiệp lớn.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    code        = EXCLUDED.code,
    name        = EXCLUDED.name,
    width_m     = EXCLUDED.width_m,
    length_m    = EXCLUDED.length_m,
    height_m    = EXCLUDED.height_m,
    environment = EXCLUDED.environment,
    description = EXCLUDED.description,
    is_active   = EXCLUDED.is_active,
    updated_at  = CURRENT_TIMESTAMP;

SELECT setval(pg_get_serial_sequence('unit_type', 'id'), COALESCE((SELECT MAX(id) FROM unit_type), 10));

-- 2. Đồng bộ bảng giá niêm yết (facility_unit_type_price) theo hệ số khu vực
WITH base_rates (code, base_per_m2) AS (
    VALUES
    ('UT-STD-XS', 240000::NUMERIC),
    ('UT-STD-S',  220000::NUMERIC),
    ('UT-STD-M',  200000::NUMERIC),
    ('UT-STD-L',  180000::NUMERIC),
    ('UT-STD-XL', 160000::NUMERIC),
    ('UT-AC-XS',  340000::NUMERIC),
    ('UT-AC-S',   310000::NUMERIC),
    ('UT-AC-M',   290000::NUMERIC),
    ('UT-AC-L',   260000::NUMERIC),
    ('UT-AC-XL',  240000::NUMERIC)
),
computed_prices AS (
    SELECT
        f.id AS facility_id,
        ut.id AS unit_type_id,
        (ROUND(
            br.base_per_m2 * CASE
                WHEN f.code IN ('FAC-Q1', 'FAC-HBT') THEN 1.15
                WHEN f.code IN ('FAC-CG', 'FAC-Q7', 'FAC-TX', 'FAC-BT', 'FAC-TD', 'FAC-HA') THEN 1.00
                ELSE 0.90
            END / 1000.0
        ) * 1000)::BIGINT AS price_per_m2,
        (ut.width_m * ut.length_m) AS area_m2
    FROM facility f
    CROSS JOIN base_rates br
    JOIN unit_type ut ON ut.code = br.code
)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price, price_per_m2)
SELECT
    cp.facility_id,
    cp.unit_type_id,
    (cp.price_per_m2 * cp.area_m2)::BIGINT AS monthly_price,
    cp.price_per_m2
FROM computed_prices cp
ON CONFLICT (facility_id, unit_type_id) DO UPDATE SET
    price_per_m2  = EXCLUDED.price_per_m2,
    monthly_price = EXCLUDED.monthly_price,
    updated_at    = CURRENT_TIMESTAMP;

-- 3. Đóng phiên bản giá cũ và ghi nhận phiên bản giá Enterprise mới hiệu lực từ hôm nay
--    (Xóa bản ghi trùng ngày nếu chạy lại để đảm bảo idempotent)
UPDATE facility_unit_type_price_version v
SET effective_to = CURRENT_DATE - 1
FROM unit_type ut
WHERE v.unit_type_id = ut.id
  AND ut.code IN ('UT-STD-XS','UT-STD-S','UT-STD-M','UT-STD-L','UT-STD-XL','UT-AC-XS','UT-AC-S','UT-AC-M','UT-AC-L','UT-AC-XL')
  AND v.effective_to IS NULL
  AND v.effective_from < CURRENT_DATE;

DELETE FROM facility_unit_type_price_version v
USING unit_type ut
WHERE v.unit_type_id = ut.id
  AND ut.code IN ('UT-STD-XS','UT-STD-S','UT-STD-M','UT-STD-L','UT-STD-XL','UT-AC-XS','UT-AC-S','UT-AC-M','UT-AC-L','UT-AC-XL')
  AND v.effective_from >= CURRENT_DATE;

INSERT INTO facility_unit_type_price_version (
    facility_id, unit_type_id, monthly_price, price_per_m2, effective_from, effective_to, created_by
)
SELECT
    futp.facility_id,
    futp.unit_type_id,
    futp.monthly_price,
    futp.price_per_m2,
    CURRENT_DATE,
    NULL,
    COALESCE(
        (SELECT id FROM app_user WHERE role = 'BUSINESS_OPERATIONS_MANAGER' ORDER BY id ASC LIMIT 1),
        4
    )
FROM facility_unit_type_price futp
JOIN unit_type ut ON ut.id = futp.unit_type_id
WHERE ut.code IN ('UT-STD-XS','UT-STD-S','UT-STD-M','UT-STD-L','UT-STD-XL','UT-AC-XS','UT-AC-S','UT-AC-M','UT-AC-L','UT-AC-XL');

-- 4. Đồng bộ con số diện tích trong ghi chú vị trí ô kho vật lý (storage_unit.location_note)
UPDATE storage_unit su
SET location_note = REGEXP_REPLACE(
    su.location_note,
    '\m(1|3|6|10|15)(\.0)?\s*m²',
    (ROUND(ut.width_m * ut.length_m)::INT)::TEXT || 'm²',
    'g'
)
FROM unit_type ut
WHERE su.unit_type_id = ut.id
  AND ut.code IN ('UT-STD-XS','UT-STD-S','UT-STD-M','UT-STD-L','UT-STD-XL','UT-AC-XS','UT-AC-S','UT-AC-M','UT-AC-L','UT-AC-XL')
  AND su.location_note IS NOT NULL
  AND su.location_note ~ '\m(1|3|6|10|15)(\.0)?\s*m²';
