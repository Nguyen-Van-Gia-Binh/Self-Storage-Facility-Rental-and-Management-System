-- ============================================================================
-- V9__sync_facility_unit_type_prices_from_versions.sql
-- Đồng bộ bảng giá snapshot (facility_unit_type_price) khớp chuẩn xác với
-- phiên bản giá đang có hiệu lực trong facility_unit_type_price_version,
-- tự động tính lại monthly_price = ROUND(price_per_m2 * width_m * length_m, -3)
-- tuân thủ quy tắc nghiệp vụ BR-GEN-04 / BR-GEN-05.
-- ============================================================================

UPDATE facility_unit_type_price futp
SET price_per_m2 = v.price_per_m2,
    monthly_price = ROUND(v.price_per_m2 * (ut.width_m * ut.length_m) / 1000) * 1000,
    updated_at = CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON (facility_id, unit_type_id)
        facility_id,
        unit_type_id,
        price_per_m2
    FROM facility_unit_type_price_version
    WHERE effective_from <= CURRENT_DATE
      AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
    ORDER BY facility_id, unit_type_id, effective_from DESC, id DESC
) v
JOIN unit_type ut ON ut.id = v.unit_type_id
WHERE futp.facility_id = v.facility_id
  AND futp.unit_type_id = v.unit_type_id;

