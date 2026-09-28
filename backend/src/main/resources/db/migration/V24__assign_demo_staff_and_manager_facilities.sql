/* ============================================================================
   Flyway Migration V24__assign_demo_staff_and_manager_facilities.sql
   Đảm bảo Quản lý cơ sở (fm.q1) và Nhân viên (staff.q1, staff@storage.vn)
   được gán đầy đủ vào các cơ sở quản lý (FAC-CG - ID 1, FAC-Q7 - ID 2)
   đồng thời chuẩn bị sẵn hợp đồng và phiếu sự cố demo để phục vụ điều phối
   và phân công nhiệm vụ thực địa (FM-05, T4.15).
   ============================================================================ */

-- 1. Gán Quản lý cơ sở fm.q1 vào FAC-CG (Cầu Giấy) và FAC-Q7 (Quận 7)
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u, facility f
WHERE u.email = 'fm.q1@smartstorage.vn'
  AND f.code IN ('FAC-CG', 'FAC-Q7')
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );

-- 2. Gán Nhân viên cơ sở staff.q1 vào FAC-CG (Cầu Giấy) và FAC-Q7 (Quận 7)
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u, facility f
WHERE u.email = 'staff.q1@smartstorage.vn'
  AND f.code IN ('FAC-CG', 'FAC-Q7')
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );

-- 3. Gán Nhân viên cơ sở staff@storage.vn vào FAC-CG nếu chưa có
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id
FROM app_user u, facility f
WHERE u.email = 'staff@storage.vn'
  AND f.code = 'FAC-CG'
  AND NOT EXISTS (
      SELECT 1 FROM user_facility_assignment ufa WHERE ufa.user_id = u.id AND ufa.facility_id = f.id
  );

-- 4. Hợp đồng PENDING_RETURN tại Cơ sở Quận 7 (Q7-A104) để kiểm tra nghiệm thu trả kho
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-20260902-8821')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RSV-20260902-8821', u.id, f.id, ut.id, su.id,
        '2026-08-01', 2, '2026-10-01', 1500000,
        pv.id, 1500000, 3000000, 4500000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-Q7'
      AND ut.code = 'UT-MEDIUM'
      AND su.code = 'Q7-A104'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260902-8821')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, return_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-20260902-8821', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '654321',
        'PENDING_RETURN', r.start_date, '2026-10-01', r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RSV-20260902-8821';
END;

-- 5. Hợp đồng PENDING_CHECK_IN tại Cơ sở Quận 7 (Q7-A103) để tiếp đón bàn giao
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-20260928-7711')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RSV-20260928-7711', u.id, f.id, ut.id, su.id,
        '2026-09-28', 1, '2026-10-28', 1500000,
        pv.id, 1500000, 1500000, 3000000,
        'CONFIRMED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-Q7'
      AND ut.code = 'UT-MEDIUM'
      AND su.code = 'Q7-A103'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260928-7711')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-20260928-7711', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '112233',
        'PENDING_CHECK_IN', NULL, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RSV-20260928-7711';
END;

-- 6. Phiếu sự cố kỹ thuật tại Cơ sở Quận 7 (Q7-A101)
IF NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20260928-0010')
BEGIN
    DECLARE @CustId BIGINT = (SELECT id FROM app_user WHERE email = 'nhi.customer@gmail.com');
    DECLARE @SuId BIGINT = (SELECT su.id FROM storage_unit su JOIN facility f ON su.facility_id = f.id WHERE f.code = 'FAC-Q7' AND su.code = 'Q7-A101');
    DECLARE @CId BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20260902-8821');

    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, created_at, updated_at
    )
    VALUES (
        'SUP-20260928-0010',
        @CustId,
        @CId,
        @SuId,
        'LOCK_ACCESS',
        N'Kẹt khóa điện tử tại ngăn kho Q7-A101: Khách hàng nhập mã số đúng nhưng chốt cơ khí không bung ra, cần nhân viên kỹ thuật trực ca đến kiểm tra và hỗ trợ mở khóa khẩn cấp.',
        'NEW',
        NULL,
        DATEADD(HOUR, 2, SYSDATETIMEOFFSET()),
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET()
    );
END;

-- 7. Hợp đồng PENDING_CHECK_IN tại Cơ sở Cầu Giấy (CG-S102) để tiếp đón nhận kho
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-20260928-6601')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RSV-20260928-6601', u.id, f.id, ut.id, su.id,
        '2026-09-28', 1, '2026-10-28', 750000,
        pv.id, 750000, 750000, 1500000,
        'CONFIRMED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-CG'
      AND ut.code = 'UT-SMALL'
      AND su.code = 'CG-S102'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260928-6601')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-20260928-6601', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '998877',
        'PENDING_CHECK_IN', NULL, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RSV-20260928-6601';
END;
