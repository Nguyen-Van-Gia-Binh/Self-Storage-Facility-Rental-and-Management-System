-- ============================================================================
-- V40__upgrade_enterprise_surcharges.sql
-- Chuẩn hóa danh mục biểu phí phụ thu lên chuẩn Doanh nghiệp lớn (Enterprise B2B)
-- đồng bộ với thang diện tích 5-100 m² & bảng giá V39 (1.2tr - 27.6tr/tháng):
--   - 4 nhóm chuẩn BR-PRI-04: ACCESS_KEY (2), CLEANING (2), DAMAGE (4), VALUE_ADDED (2)
--   - Kết hợp FIXED (300k - 3.5tr) & PERCENTAGE (25%, 50% đơn giá tháng) cho hư hại lớn
--   - Bật HANDOVER_SETUP (300k) ở checkout; tạm ngưng FORKLIFT_SUPPORT (800k) để không tự cộng
--   - Soft-disable (is_active = FALSE) toàn bộ dòng test/legacy ngoài danh mục chuẩn (giữ nguyên FK)
-- ============================================================================

SELECT setval(
    pg_get_serial_sequence('extra_fee_type', 'id'),
    COALESCE((SELECT MAX(id) FROM extra_fee_type), 1)
);

-- 1. Tạm ngưng toàn bộ dòng test/ngoài danh mục chuẩn (giữ nguyên toàn vẹn khóa ngoại hợp đồng)
UPDATE extra_fee_type
SET is_active  = FALSE,
    updated_at = CURRENT_TIMESTAMP
WHERE is_active = TRUE
  AND code NOT IN (
      'ACCESS_CARD_REISSUE', 'OVERDUE_LOCK',
      'CLEANING_FEE', 'CLEANING_INDUSTRIAL',
      'DAMAGE_MINOR', 'DAMAGE_DOOR_SYSTEM', 'DAMAGE_FLOOR_EPOXY', 'DAMAGE_MAJOR',
      'HANDOVER_SETUP', 'FORKLIFT_SUPPORT'
  );

-- 2. Upsert 10 khoản phụ phí chuẩn Enterprise B2B (toàn hệ thống) và ghi nhận phiên bản audit
WITH upserted AS (
    INSERT INTO extra_fee_type (code, name, amount, facility_id, category, fee_type, effective_from, is_active)
    VALUES
    ('ACCESS_CARD_REISSUE', 'Phí cấp lại thẻ từ kiểm soát ra vào / remote cổng',                 300000, NULL, 'ACCESS_KEY',  'FIXED',      CURRENT_DATE, TRUE),
    ('OVERDUE_LOCK',        'Phí cắt khóa cơ / niêm phong cưỡng chế quá hạn',                      500000, NULL, 'ACCESS_KEY',  'FIXED',      CURRENT_DATE, TRUE),
    ('CLEANING_FEE',        'Phí vệ sinh công nghiệp tiêu chuẩn khi trả kho',                      500000, NULL, 'CLEANING',    'FIXED',      CURRENT_DATE, TRUE),
    ('CLEANING_INDUSTRIAL', 'Phí thu gom rác thải công nghiệp, pallet & khử mùi kho',             1500000, NULL, 'CLEANING',    'FIXED',      CURRENT_DATE, TRUE),
    ('DAMAGE_MINOR',        'Phí khắc phục hư hại nhẹ (ổ khóa, vách ngăn, biển mã kho)',          1000000, NULL, 'DAMAGE',      'FIXED',      CURRENT_DATE, TRUE),
    ('DAMAGE_DOOR_SYSTEM',  'Phí sửa chữa cửa cuốn, khóa điện từ & cảm biến an ninh',             3500000, NULL, 'DAMAGE',      'FIXED',      CURRENT_DATE, TRUE),
    ('DAMAGE_FLOOR_EPOXY',  'Phí phục hồi sàn Epoxy / vách ngăn do xe nâng & tải nặng',                25, NULL, 'DAMAGE',      'PERCENTAGE', CURRENT_DATE, TRUE),
    ('DAMAGE_MAJOR',        'Phí bồi thường hư hại nghiêm trọng kết cấu / PCCC & điều hòa',            50, NULL, 'DAMAGE',      'PERCENTAGE', CURRENT_DATE, TRUE),
    ('HANDOVER_SETUP',      'Phí thiết lập hồ sơ bàn giao & cấp tài khoản ra vào doanh nghiệp',    300000, NULL, 'VALUE_ADDED', 'FIXED',      CURRENT_DATE, TRUE),
    ('FORKLIFT_SUPPORT',    'Phí hỗ trợ xe nâng & bốc xếp hàng pallet theo ca',                    800000, NULL, 'VALUE_ADDED', 'FIXED',      CURRENT_DATE, FALSE)
    ON CONFLICT (code) DO UPDATE SET
        name           = EXCLUDED.name,
        amount         = EXCLUDED.amount,
        facility_id    = EXCLUDED.facility_id,
        category       = EXCLUDED.category,
        fee_type       = EXCLUDED.fee_type,
        effective_from = EXCLUDED.effective_from,
        is_active      = EXCLUDED.is_active,
        updated_at     = CURRENT_TIMESTAMP
    RETURNING id, code, name, facility_id, amount, fee_type, category, is_active, effective_from
)
INSERT INTO extra_fee_version (
    extra_fee_type_id, code, name, facility_id, amount, fee_type, category, is_active, effective_from, created_by
)
SELECT
    u.id,
    u.code,
    u.name,
    u.facility_id,
    u.amount,
    u.fee_type,
    u.category,
    u.is_active,
    u.effective_from,
    COALESCE(
        (SELECT id FROM app_user WHERE role = 'BUSINESS_OPERATIONS_MANAGER' ORDER BY id ASC LIMIT 1),
        4
    )
FROM upserted u;

SELECT setval(
    pg_get_serial_sequence('extra_fee_type', 'id'),
    COALESCE((SELECT MAX(id) FROM extra_fee_type), 1)
);
SELECT setval(
    pg_get_serial_sequence('extra_fee_version', 'id'),
    COALESCE((SELECT MAX(id) FROM extra_fee_version), 1)
);
