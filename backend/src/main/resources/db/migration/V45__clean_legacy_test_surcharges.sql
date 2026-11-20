-- ============================================================================
-- V45__clean_legacy_test_surcharges.sql
-- Dọn dẹp toàn bộ dữ liệu phụ phí rác/test (LOI-MOI, HU-HAI-NANG, PHA-NANG, PHI-VE-SINH...)
-- và tái liên kết khóa ngoại contract_extra_charge về danh mục chuẩn DAMAGE_MAJOR.
-- Đảm bảo bảng biểu phí & phụ thu chỉ giữ lại 10 khoản chuẩn Enterprise B2B (V40).
-- ============================================================================

-- 1. Tái liên kết hợp đồng cũ trỏ về DAMAGE_MAJOR để bảo toàn dữ liệu tài chính
UPDATE contract_extra_charge
SET extra_fee_type_id = (SELECT id FROM extra_fee_type WHERE code = 'DAMAGE_MAJOR' LIMIT 1)
WHERE extra_fee_type_id IN (
    SELECT id FROM extra_fee_type
    WHERE code IN ('LOI-MOI', 'HU-HAI-NANG', 'PHA-NANG', 'PHI-VE-SINH-HU-HAI-NANG', 'DMG_001')
);

-- 2. Xóa các phiên bản lịch sử của phụ phí rác/test
DELETE FROM extra_fee_version
WHERE extra_fee_type_id IN (
    SELECT id FROM extra_fee_type
    WHERE code IN ('LOI-MOI', 'HU-HAI-NANG', 'PHA-NANG', 'PHI-VE-SINH-HU-HAI-NANG', 'DMG_001')
);

-- 3. Xóa các bản ghi phụ phí rác/test khỏi extra_fee_type
DELETE FROM extra_fee_type
WHERE code IN ('LOI-MOI', 'HU-HAI-NANG', 'PHA-NANG', 'PHI-VE-SINH-HU-HAI-NANG', 'DMG_001');
