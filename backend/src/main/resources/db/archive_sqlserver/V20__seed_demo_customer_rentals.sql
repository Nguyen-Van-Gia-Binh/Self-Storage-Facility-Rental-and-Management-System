/* ============================================================================
   Flyway Migration V20__seed_demo_customer_rentals.sql
   Bổ sung 3 hợp đồng đang hoạt động (ACTIVE) và 1 hợp đồng quá hạn (OVERDUE)
   cho tài khoản khách hàng Nguyễn Phạm Xuân Nhi (nhi.customer@gmail.com).
   Đồng bộ cho tất cả các thành viên trong nhóm phục vụ kiểm thử và demo (Flow 1, Flow 6.1, SC-05).
   ============================================================================ */

-- 1. Đảm bảo tài khoản khách hàng nhi.customer@gmail.com tồn tại
IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'nhi.customer@gmail.com')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('nhi.customer@gmail.com', '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', N'Nguyễn Phạm Xuân Nhi', '0967890123', '079099007890', 'STORAGE_CUSTOMER', 'ACTIVE');
END;

-- 2. Cập nhật trạng thái ô kho thành OCCUPIED
UPDATE su
SET su.status = 'OCCUPIED'
FROM storage_unit su
JOIN facility f ON su.facility_id = f.id
WHERE (f.code = 'FAC-Q1' AND su.code = 'Q1-A103')
   OR (f.code = 'FAC-CG' AND su.code = 'CG-M204')
   OR (f.code = 'FAC-HC' AND su.code = 'HC-A105')
   OR (f.code = 'FAC-BT' AND su.code = 'BT-A103');

-- ============================================================================
-- HỢP ĐỒNG 1 (ACTIVE - Cơ sở Quận 1): Còn ~34 ngày -> Kích hoạt cảnh báo gia hạn sớm (Flow 6.1)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-NHI-001')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-NHI-001', u.id, f.id, ut.id, su.id,
        '2026-08-01', 3, '2026-11-01', 1050000,
        pv.id, 1050000, 3150000, 4200000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-Q1'
      AND ut.code = 'UT-MEDIUM'
      AND su.code = 'Q1-A103'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-NHI-001')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-NHI-001', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '123456',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-NHI-001';
END;

-- ============================================================================
-- HỢP ĐỒNG 2 (ACTIVE - Cơ sở Cầu Giấy Hà Nội): Hạn dài 6 tháng -> Test đổi mã PIN, chi tiết
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-NHI-002')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-NHI-002', u.id, f.id, ut.id, su.id,
        '2026-09-01', 6, '2027-03-01', 1050000,
        pv.id, 1050000, 6300000, 7350000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-CG'
      AND ut.code = 'UT-MEDIUM'
      AND su.code = 'CG-M204'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-NHI-002')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-NHI-002', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '888999',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-NHI-002';
END;

-- ============================================================================
-- HỢP ĐỒNG 3 (ACTIVE - Cơ sở Hải Châu Đà Nẵng): Kỳ hạn 3 tháng -> Test đăng ký trả kho
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-NHI-003')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-NHI-003', u.id, f.id, ut.id, su.id,
        '2026-09-15', 3, '2026-12-15', 1050000,
        pv.id, 1050000, 3150000, 4200000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-HC'
      AND ut.code = 'UT-MEDIUM'
      AND su.code = 'HC-A105'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-NHI-003')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-NHI-003', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '654321',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-NHI-003';
END;

-- ============================================================================
-- HỢP ĐỒNG 4 (OVERDUE - Cơ sở Bình Thạnh): Hết hạn 20/09/2026 -> Quá hạn 8 ngày (khóa mã PIN)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-NHI-004')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-NHI-004', u.id, f.id, ut.id, su.id,
        '2026-06-01', 3, '2026-09-20', 1050000,
        pv.id, 1050000, 3150000, 4200000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-BT'
      AND ut.code = 'UT-MEDIUM'
      AND su.code = 'BT-A103'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-NHI-004')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-NHI-004', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '999111',
        'OVERDUE', r.start_date, r.policy_version_id, 525000
    FROM reservation r
    WHERE r.code = 'RES-NHI-004';
END;

-- ============================================================================
-- 3. Bổ sung nhật ký ra vào mẫu cho Hợp đồng 1 & 2 (Access Log)
-- ============================================================================
IF EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-NHI-001')
BEGIN
    DECLARE @C1_ID BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-001');
    DECLARE @U1_ID BIGINT = (SELECT storage_unit_id FROM rental_contract WHERE code = 'CTR-NHI-001');

    IF NOT EXISTS (SELECT 1 FROM access_log WHERE contract_id = @C1_ID)
    BEGIN
        INSERT INTO access_log (contract_id, storage_unit_id, accessed_at, method, accessor_name, status, device_info)
        VALUES 
        (@C1_ID, @U1_ID, DATEADD(HOUR, -2, GETDATE()), 'PIN_CODE', N'Nguyễn Phạm Xuân Nhi', 'SUCCESS', N'Bàn phím cảm ứng tủ ô kho Q1-A103'),
        (@C1_ID, @U1_ID, DATEADD(DAY, -2, GETDATE()), 'QR_PASS', N'Nguyễn Phạm Xuân Nhi', 'SUCCESS', N'Cổng quét QR an ninh sảnh Q1');
    END;
END;
