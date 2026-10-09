/* ============================================================================
   Flyway Migration V47__seed_contracts_for_orphan_occupied_units.sql
   Bổ sung Hợp đồng thuê thực tế cho các ô kho đang được đánh dấu OCCUPIED (Đang thuê)
   nhưng chưa có hợp đồng liên kết trong CSDL (được seed từ V16):
   1. HC-B202 (Cơ sở Hải Châu - Đà Nẵng, Kho Lớn UT-LARGE)
   2. HBT-A103 (Cơ sở Hai Bà Trưng - Hà Nội, Kho Nhỏ UT-SMALL)
   3. Q7-A104 (Cơ sở Quận 7 - TP.HCM, Kho Vừa UT-MEDIUM)
   Khắc phục hiện tượng: Ô kho báo Đang thuê nhưng cột Khách thuê hiện tại rỗng
   và trang chi tiết ô kho hiển thị "Ô kho đang trống".
   ============================================================================ */

-- ============================================================================
-- 1. HỢP ĐỒNG CHO Ô KHO HC-B202 (Cơ sở Hải Châu Đà Nẵng, Kho Lớn)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-DEMO-HC-B202')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-DEMO-HC-B202', u.id, f.id, ut.id, su.id,
        '2026-08-01', 6, '2027-02-01', 2200000,
        pv.id, 2200000, 13200000, 15400000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-HC'
      AND ut.code = 'UT-LARGE'
      AND su.code = 'HC-B202'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-DEMO-HC-B202')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-DEMO-HC-B202', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '123456',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-DEMO-HC-B202';
END;

-- ============================================================================
-- 2. HỢP ĐỒNG CHO Ô KHO HBT-A103 (Cơ sở Hai Bà Trưng Hà Nội, Kho Nhỏ)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-DEMO-HBT-A103')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-DEMO-HBT-A103', u.id, f.id, ut.id, su.id,
        '2026-07-15', 6, '2027-01-15', 550000,
        pv.id, 550000, 3300000, 3850000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-HBT'
      AND ut.code = 'UT-SMALL'
      AND su.code = 'HBT-A103'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-DEMO-HBT-A103')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-DEMO-HBT-A103', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '654321',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-DEMO-HBT-A103';
END;

-- ============================================================================
-- 3. HỢP ĐỒNG CHO Ô KHO Q7-A104 (Cơ sở Quận 7 TP.HCM, Kho Vừa)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-DEMO-Q7-A104')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-DEMO-Q7-A104', u.id, f.id, ut.id, su.id,
        '2026-08-15', 6, '2027-02-15', 1050000,
        pv.id, 1050000, 6300000, 7350000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-Q7'
      AND ut.code = 'UT-MEDIUM'
      AND su.code = 'Q7-A104'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-DEMO-Q7-A104')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-DEMO-Q7-A104', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '778899',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-DEMO-Q7-A104';
END;
