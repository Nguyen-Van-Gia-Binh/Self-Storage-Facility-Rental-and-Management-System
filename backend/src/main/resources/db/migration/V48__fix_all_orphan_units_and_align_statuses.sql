/* ============================================================================
   Flyway Migration V48__fix_all_orphan_units_and_align_statuses.sql
   Xử lý triệt để toàn bộ các ô kho mồ côi (Orphan Units) và lệch trạng thái
   phát hiện qua kiểm toán toàn diện database (Comprehensive Database Audit):

   1. CG-S104 (Cầu Giấy - Kho Nhỏ): OCCUPIED nhưng thiếu hợp đồng -> Seed HĐ ACTIVE
   2. CG-C404 (Cầu Giấy - Kho Lạnh): OCCUPIED nhưng thiếu hợp đồng -> Seed HĐ ACTIVE
   3. Q1-B201 (Quận 1 - Kho Lớn): OCCUPIED nhưng HĐ cũ đã CLOSED -> Seed HĐ mới CTR-20260926-1283
   4. Q1-B203 (Quận 1 - Kho Lạnh): Ghi chú "đang có khách đặt" nhưng thiếu đơn -> Seed HĐ PENDING_CHECK_IN
   5. HBT-B202 (Hai Bà Trưng - Kho Vừa): RESERVED nhưng không có đơn đặt -> Chuyển về AVAILABLE
   6. Q7-A103 (Quận 7 - Kho Vừa): Có HĐ PENDING_CHECK_IN nhưng unit là AVAILABLE -> Chuyển sang RESERVED
   ============================================================================ */

-- ============================================================================
-- 1. CG-S104 (Cơ sở Cầu Giấy, Kho Nhỏ UT-SMALL)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-DEMO-CG-S104')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-DEMO-CG-S104', u.id, f.id, ut.id, su.id,
        '2026-08-01', 6, '2027-02-01', 600000,
        pv.id, 600000, 3600000, 4200000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-CG'
      AND ut.code = 'UT-SMALL'
      AND su.code = 'CG-S104'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-DEMO-CG-S104')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-DEMO-CG-S104', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '334455',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-DEMO-CG-S104';
END;

-- ============================================================================
-- 2. CG-C404 (Cơ sở Cầu Giấy, Kho Lạnh UT-CLIMATE)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-DEMO-CG-C404')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-DEMO-CG-C404', u.id, f.id, ut.id, su.id,
        '2026-08-01', 6, '2027-02-01', 1800000,
        pv.id, 1800000, 10800000, 12600000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-CG'
      AND ut.code = 'UT-CLIMATE'
      AND su.code = 'CG-C404'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-DEMO-CG-C404')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-DEMO-CG-C404', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '556677',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-DEMO-CG-C404';
END;

-- ============================================================================
-- 3. Q1-B201 (Cơ sở Quận 1, Kho Lớn UT-LARGE) - Bổ sung CTR-20260926-1283
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-20260926-1283')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RSV-20260926-1283', u.id, f.id, ut.id, su.id,
        '2026-09-26', 6, '2027-03-26', 2500000,
        pv.id, 2500000, 15000000, 17500000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-Q1'
      AND ut.code = 'UT-LARGE'
      AND su.code = 'Q1-B201'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260926-1283')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-20260926-1283', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '998877',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RSV-20260926-1283';
END;

-- ============================================================================
-- 4. Q1-B203 (Cơ sở Quận 1, Kho Lạnh UT-CLIMATE) - Có khách đặt chờ Check-in
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-DEMO-Q1-B203')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RSV-DEMO-Q1-B203', u.id, f.id, ut.id, su.id,
        '2026-10-10', 3, '2027-01-10', 2000000,
        pv.id, 2000000, 6000000, 8000000,
        'CONFIRMED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), NULL
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-Q1'
      AND ut.code = 'UT-CLIMATE'
      AND su.code = 'Q1-B203'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-DEMO-Q1-B203')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-DEMO-Q1-B203', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, NULL,
        'PENDING_CHECK_IN', NULL, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RSV-DEMO-Q1-B203';
END;

-- ============================================================================
-- 5. HBT-B202 (Cơ sở Hai Bà Trưng, Kho Vừa UT-MEDIUM): Chuyển về AVAILABLE
-- ============================================================================
UPDATE su
SET su.status = 'AVAILABLE'
FROM storage_unit su
JOIN facility f ON su.facility_id = f.id
WHERE f.code = 'FAC-HBT' AND su.code = 'HBT-B202';

-- ============================================================================
-- 6. Q7-A103 (Cơ sở Quận 7, Kho Vừa UT-MEDIUM): Đồng bộ về RESERVED
-- ============================================================================
UPDATE su
SET su.status = 'RESERVED'
FROM storage_unit su
JOIN facility f ON su.facility_id = f.id
WHERE f.code = 'FAC-Q7' AND su.code = 'Q7-A103';
