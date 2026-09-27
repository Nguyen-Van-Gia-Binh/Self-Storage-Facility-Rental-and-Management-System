/* ============================================================================
   Flyway Migration V21__update_demo_contracts_to_distinct_units.sql
   [GHI CHÚ QUAN TRỌNG: MỤC ĐÍCH KIỂM THỬ & DEMO (TEST ONLY)]
   Cập nhật 4 hợp đồng kiểm thử của Nguyễn Phạm Xuân Nhi sang các ô kho thực tế
   hoàn toàn khác biệt, tránh trùng lặp mã số (A103, A104) và đa dạng đủ 4 loại kho:
   - Kho 1 (ACTIVE - Cảnh báo gia hạn): Cơ sở Quận 1 (Q1-B201 - Kho Lớn Tầng 2)
   - Kho 2 (ACTIVE - Đổi PIN & Chi tiết): Cơ sở Cầu Giấy (CG-S101 - Kho Nhỏ Tầng 1)
   - Kho 3 (ACTIVE - Trả kho): Cơ sở Hải Châu (HC-B203 - Kho Máy Lạnh Tầng 2)
   - Kho 4 (OVERDUE - Quá hạn khóa PIN): Cơ sở Bình Thạnh (BT-A102 - Kho Nhỏ Tầng 1)
   ============================================================================ */

-- 1. Giải phóng các ô kho cũ về AVAILABLE
UPDATE su
SET su.status = 'AVAILABLE'
FROM storage_unit su
JOIN facility f ON su.facility_id = f.id
WHERE (f.code = 'FAC-Q1' AND su.code = 'Q1-A103')
   OR (f.code = 'FAC-CG' AND su.code = 'CG-M204')
   OR (f.code = 'FAC-HC' AND su.code = 'HC-A105')
   OR (f.code = 'FAC-BT' AND su.code = 'BT-A103');

-- 2. Đánh dấu các ô kho mới sang OCCUPIED
UPDATE su
SET su.status = 'OCCUPIED'
FROM storage_unit su
JOIN facility f ON su.facility_id = f.id
WHERE (f.code = 'FAC-Q1' AND su.code = 'Q1-B201')
   OR (f.code = 'FAC-CG' AND su.code = 'CG-S101')
   OR (f.code = 'FAC-HC' AND su.code = 'HC-B203')
   OR (f.code = 'FAC-BT' AND su.code = 'BT-A102');

-- 3. Cập nhật Hợp đồng 1: Quận 1 -> Kho Lớn (Q1-B201)
IF EXISTS (SELECT 1 FROM rental_contract WHERE code IN ('CTR-NHI-001', 'CTR-20260801-7182'))
BEGIN
    DECLARE @SuId1 BIGINT = (SELECT su.id FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-Q1' AND su.code = 'Q1-B201');
    DECLARE @UtId1 BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-LARGE');

    UPDATE rental_contract
    SET code = 'CTR-20260801-7182',
        storage_unit_id = @SuId1,
        unit_type_id = @UtId1,
        monthly_price_snapshot = 2200000,
        deposit_amount = 2200000,
        deposit_balance = 2200000,
        total_rental_fee = 6600000
    WHERE code IN ('CTR-NHI-001', 'CTR-20260801-7182');

    UPDATE reservation
    SET code = 'RSV-20260801-7182',
        storage_unit_id = @SuId1,
        unit_type_id = @UtId1,
        monthly_price_snapshot = 2200000,
        deposit_amount = 2200000,
        total_rental_fee = 6600000,
        total_payable = 8800000
    WHERE code IN ('RES-NHI-001', 'RSV-20260801-7182');
END;

-- 4. Cập nhật Hợp đồng 2: Cầu Giấy -> Kho Nhỏ (CG-S101)
IF EXISTS (SELECT 1 FROM rental_contract WHERE code IN ('CTR-NHI-002', 'CTR-20260901-3814'))
BEGIN
    DECLARE @SuId2 BIGINT = (SELECT su.id FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-CG' AND su.code = 'CG-S101');
    DECLARE @UtId2 BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-SMALL');

    UPDATE rental_contract
    SET code = 'CTR-20260901-3814',
        storage_unit_id = @SuId2,
        unit_type_id = @UtId2,
        monthly_price_snapshot = 500000,
        deposit_amount = 500000,
        deposit_balance = 500000,
        total_rental_fee = 3000000
    WHERE code IN ('CTR-NHI-002', 'CTR-20260901-3814');

    UPDATE reservation
    SET code = 'RSV-20260901-3814',
        storage_unit_id = @SuId2,
        unit_type_id = @UtId2,
        monthly_price_snapshot = 500000,
        deposit_amount = 500000,
        total_rental_fee = 3000000,
        total_payable = 3500000
    WHERE code IN ('RES-NHI-002', 'RSV-20260901-3814');
END;

-- 5. Cập nhật Hợp đồng 3: Đà Nẵng -> Kho Máy Lạnh (HC-B203)
IF EXISTS (SELECT 1 FROM rental_contract WHERE code IN ('CTR-NHI-003', 'CTR-20260915-5291'))
BEGIN
    DECLARE @SuId3 BIGINT = (SELECT su.id FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-HC' AND su.code = 'HC-B203');
    DECLARE @UtId3 BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-CLIMATE');

    UPDATE rental_contract
    SET code = 'CTR-20260915-5291',
        storage_unit_id = @SuId3,
        unit_type_id = @UtId3,
        monthly_price_snapshot = 1450000,
        deposit_amount = 1450000,
        deposit_balance = 1450000,
        total_rental_fee = 4350000
    WHERE code IN ('CTR-NHI-003', 'CTR-20260915-5291');

    UPDATE reservation
    SET code = 'RSV-20260915-5291',
        storage_unit_id = @SuId3,
        unit_type_id = @UtId3,
        monthly_price_snapshot = 1450000,
        deposit_amount = 1450000,
        total_rental_fee = 4350000,
        total_payable = 5800000
    WHERE code IN ('RES-NHI-003', 'RSV-20260915-5291');
END;

-- 6. Cập nhật Hợp đồng 4 (OVERDUE): Bình Thạnh -> Kho Nhỏ (BT-A102)
IF EXISTS (SELECT 1 FROM rental_contract WHERE code IN ('CTR-NHI-004', 'CTR-20260601-9403'))
BEGIN
    DECLARE @SuId4 BIGINT = (SELECT su.id FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-BT' AND su.code = 'BT-A102');
    DECLARE @UtId4 BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-SMALL');

    UPDATE rental_contract
    SET code = 'CTR-20260601-9403',
        storage_unit_id = @SuId4,
        unit_type_id = @UtId4,
        monthly_price_snapshot = 500000,
        deposit_amount = 500000,
        deposit_balance = 500000,
        total_rental_fee = 1500000,
        overdue_fee_accrued = 250000
    WHERE code IN ('CTR-NHI-004', 'CTR-20260601-9403');

    UPDATE reservation
    SET code = 'RSV-20260601-9403',
        storage_unit_id = @SuId4,
        unit_type_id = @UtId4,
        monthly_price_snapshot = 500000,
        deposit_amount = 500000,
        total_rental_fee = 1500000,
        total_payable = 2000000
    WHERE code IN ('RES-NHI-004', 'RSV-20260601-9403');
END;
