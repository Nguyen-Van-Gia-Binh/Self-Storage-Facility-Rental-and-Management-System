-- ============================================================================
-- V16__standardize_unit_types_and_sizes.sql
-- Chuẩn hóa toàn diện danh mục Loại Ô Kho (Unit Type Taxonomy) cho hệ thống Self-Storage
-- 1. Xóa bỏ hoàn toàn các loại kho công nghiệp logistics không phù hợp (kho đông, kho mát nông sản, kho ngoại quan, bãi container).
-- 2. Quy chuẩn hóa về 2 danh mục môi trường (STANDARD & CLIMATE_CONTROLLED).
-- 3. Phân cấp mỗi danh mục theo 5 kích thước quy chuẩn: XS (1m²), S (3m²), M (6m²), L (10m²), XL (15m²).
-- 4. Chuẩn hóa giá niêm yết thực tế cho cả 15 cơ sở và làm sạch mã ô kho vật lý.
-- ============================================================================

-- 1. Cập nhật 6 loại kho hiện có về định dạng chuẩn Self-Storage (Bảo toàn Foreign Keys)
UPDATE unit_type SET
    code = 'UT-STD-S',
    name = 'Kho Tiêu Chuẩn S',
    width_m = 1.50,
    length_m = 2.00,
    height_m = 2.50,
    environment = 'STANDARD',
    description = 'Kho tiêu chuẩn kích thước S (3.0 m² · 7.5 m³). Phù hợp lưu trữ đồ dùng phòng trọ, 1 xe máy, 10-15 thùng đồ cá nhân.',
    is_active = TRUE
WHERE id = 1;

UPDATE unit_type SET
    code = 'UT-STD-M',
    name = 'Kho Tiêu Chuẩn M',
    width_m = 2.00,
    length_m = 3.00,
    height_m = 2.50,
    environment = 'STANDARD',
    description = 'Kho tiêu chuẩn kích thước M (6.0 m² · 15.0 m³). Phù hợp đồ đạc căn hộ 1-2 phòng ngủ (sofa, tủ lạnh, bàn ghế, 20-30 thùng đồ).',
    is_active = TRUE
WHERE id = 2;

UPDATE unit_type SET
    code = 'UT-STD-L',
    name = 'Kho Tiêu Chuẩn L',
    width_m = 2.50,
    length_m = 4.00,
    height_m = 2.50,
    environment = 'STANDARD',
    description = 'Kho tiêu chuẩn kích thước L (10.0 m² · 25.0 m³). Phù hợp chuyển nhà trọn gói, toàn bộ nội thất căn hộ 2-3 phòng ngủ.',
    is_active = TRUE
WHERE id = 3;

UPDATE unit_type SET
    code = 'UT-AC-S',
    name = 'Kho Máy Lạnh S',
    width_m = 1.50,
    length_m = 2.00,
    height_m = 2.50,
    environment = 'CLIMATE_CONTROLLED',
    description = 'Kho điều hòa kiểm soát nhiệt ẩm 24/7 (20°C - 25°C). Phù hợp thiết bị điện tử, âm thanh, đồ da hàng hiệu, tranh ảnh giá trị.',
    is_active = TRUE
WHERE id = 4;

UPDATE unit_type SET
    code = 'UT-AC-M',
    name = 'Kho Máy Lạnh M',
    width_m = 2.00,
    length_m = 3.00,
    height_m = 2.50,
    environment = 'CLIMATE_CONTROLLED',
    description = 'Kho điều hòa kiểm soát nhiệt ẩm 24/7 (20°C - 25°C). Phù hợp lưu trữ rượu vang, đàn piano, nội thất gỗ quý, mỹ phẩm cao cấp.',
    is_active = TRUE
WHERE id = 5;

UPDATE unit_type SET
    code = 'UT-AC-L',
    name = 'Kho Máy Lạnh L',
    width_m = 2.50,
    length_m = 4.00,
    height_m = 2.50,
    environment = 'CLIMATE_CONTROLLED',
    description = 'Kho điều hòa kiểm soát nhiệt ẩm 24/7 (20°C - 25°C). Phù hợp mỹ phẩm phân phối, thực phẩm chức năng, thiết bị y tế tinh vi.',
    is_active = TRUE
WHERE id = 6;

-- 2. Chèn 4 loại kho còn thiếu để hoàn thiện đủ 10 kiểu kho (5 Standard + 5 Climate)
INSERT INTO unit_type (id, code, name, width_m, length_m, height_m, environment, description, is_active)
VALUES
(7,  'UT-STD-XS', 'Kho Tiêu Chuẩn XS', 1.00, 1.00, 2.50, 'STANDARD',           'Tủ khóa cá nhân mini (1.0 m² · 2.5 m³). Phù hợp vali du lịch, tài liệu hồ sơ, thùng carton nhỏ.', TRUE),
(8,  'UT-STD-XL', 'Kho Tiêu Chuẩn XL', 3.00, 5.00, 3.00, 'STANDARD',           'Kho tiêu chuẩn thương mại (15.0 m² · 45.0 m³). Phù hợp hàng kinh doanh online, vật tư sự kiện, thiết bị lớn.', TRUE),
(9,  'UT-AC-XS',  'Kho Máy Lạnh XS',  1.00, 1.00, 2.50, 'CLIMATE_CONTROLLED', 'Tủ điều hòa nhiệt ẩm mini 24/7 (1.0 m² · 2.5 m³). Phù hợp máy ảnh, ống kính, đồng hồ, túi xách hiệu, hồ sơ mật.', TRUE),
(10, 'UT-AC-XL',  'Kho Máy Lạnh XL',  3.00, 5.00, 3.00, 'CLIMATE_CONTROLLED', 'Tổng kho lạnh thương mại 24/7 (15.0 m² · 45.0 m³). Phù hợp hàng xa xỉ phẩm, dược phẩm chuỗi phân phối.', TRUE)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    width_m = EXCLUDED.width_m,
    length_m = EXCLUDED.length_m,
    height_m = EXCLUDED.height_m,
    environment = EXCLUDED.environment,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- Đồng bộ sequence cho unit_type
SELECT setval(pg_get_serial_sequence('unit_type', 'id'), COALESCE((SELECT MAX(id) FROM unit_type), 10));

-- 3. Chuẩn hóa Bảng giá niêm yết (facility_unit_type_price) cho tất cả các cơ sở hiện có
-- Định giá niêm yết chuẩn Self-Storage:
-- Tiêu chuẩn: XS (350k), S (750k), M (1.5tr), L (2.4tr), XL (3.5tr)
-- Máy lạnh:    XS (500k), S (1.1tr), M (2.1tr), L (3.4tr), XL (4.8tr)
WITH standard_prices (unit_type_id, monthly_price, price_per_m2) AS (
    VALUES
    (7,   350000, 350000), -- UT-STD-XS (1m²)
    (1,   750000, 250000), -- UT-STD-S  (3m²)
    (2,  1500000, 250000), -- UT-STD-M  (6m²)
    (3,  2400000, 240000), -- UT-STD-L  (10m²)
    (8,  3500000, 233333), -- UT-STD-XL (15m²)
    (9,   500000, 500000), -- UT-AC-XS  (1m²)
    (4,  1100000, 366666), -- UT-AC-S   (3m²)
    (5,  2100000, 350000), -- UT-AC-M   (6m²)
    (6,  3400000, 340000), -- UT-AC-L   (10m²)
    (10, 4800000, 320000)  -- UT-AC-XL  (15m²)
)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price, price_per_m2)
SELECT f.id, sp.unit_type_id, sp.monthly_price, sp.price_per_m2
FROM facility f
CROSS JOIN standard_prices sp
ON CONFLICT (facility_id, unit_type_id)
DO UPDATE SET
    monthly_price = EXCLUDED.monthly_price,
    price_per_m2  = EXCLUDED.price_per_m2;

-- 4. Đồng bộ phiên bản bảng giá (facility_unit_type_price_version)
WITH standard_prices (unit_type_id, monthly_price, price_per_m2) AS (
    VALUES
    (7,   350000, 350000),
    (1,   750000, 250000),
    (2,  1500000, 250000),
    (3,  2400000, 240000),
    (8,  3500000, 233333),
    (9,   500000, 500000),
    (4,  1100000, 366666),
    (5,  2100000, 350000),
    (6,  3400000, 340000),
    (10, 4800000, 320000)
)
INSERT INTO facility_unit_type_price_version (
    facility_id, unit_type_id, monthly_price, price_per_m2, effective_from, effective_to, created_by
)
SELECT f.id, sp.unit_type_id, sp.monthly_price, sp.price_per_m2, '2026-01-01 00:00:00+07', NULL, 4
FROM facility f
CROSS JOIN standard_prices sp
ON CONFLICT DO NOTHING;

-- 5. Làm sạch mã ô kho vật lý (storage_unit) loại bỏ các tiền tố không phù hợp
UPDATE storage_unit SET code = REPLACE(code, 'BOND-', 'AC-') WHERE code LIKE '%BOND-%';
UPDATE storage_unit SET code = REPLACE(code, 'YARD-', 'STD-') WHERE code LIKE '%YARD-%';
