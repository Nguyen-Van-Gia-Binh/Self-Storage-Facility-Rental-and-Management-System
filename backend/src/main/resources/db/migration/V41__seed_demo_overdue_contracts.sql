/* ============================================================================
   Flyway Migration V39__seed_demo_overdue_contracts.sql
   Tạo 2 hợp đồng quá hạn mẫu (OVERDUE) cho tài khoản demo Nguyễn Phạm Xuân Nhi
   (nhi.customer@gmail.com) phục vụ kiểm thử và demo các quy định:
   1. Hợp đồng 1: Quá hạn D+8 (hết hạn 22/09/2026), nợ phạt 250.000 đ
      -> Khóa mã PIN an ninh (Task 7 / BR-OVD-03).
      -> Sau khi nộp phạt thì mở lại mã PIN và hiện badge cam "Đã tất toán phạt" (Task 8 / BR-OVD-08).
      -> Mở khóa quyền Gia hạn hợp đồng trực tuyến và Báo trả kho (Task 9, Task 10 / BR-REN-02, BR-RET-01).
   2. Hợp đồng 2: Quá hạn D+5 (hết hạn 25/09/2026), nợ phạt 150.000 đ
      -> Trong khung D+4..D+6: Đang tính phí phạt nhưng mã PIN VẪN MỞ ĐƯỢC để dọn đồ (Task 7 / BR-OVD-02).
   ============================================================================ */

-- 1. HỢP ĐỒNG QUÁ HẠN D+8 (Cơ sở Bình Thạnh - Ô BT-A101)
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-20260622-9901')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RSV-20260622-9901', u.id, f.id, ut.id, su.id,
        '2026-06-22', 3, '2026-09-22', 500000,
        1, 500000, 1500000, 2000000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-BT'
      AND ut.code = 'UT-SMALL'
      AND su.code = 'BT-A101'
      AND su.facility_id = f.id;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260622-9901')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-20260622-9901', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '112233',
        'OVERDUE', r.start_date, r.policy_version_id, 250000
    FROM reservation r
    WHERE r.code = 'RSV-20260622-9901';

    -- Đánh dấu ô kho là OCCUPIED
    UPDATE su
    SET su.status = 'OCCUPIED'
    FROM storage_unit su
    JOIN facility f ON su.facility_id = f.id
    WHERE f.code = 'FAC-BT' AND su.code = 'BT-A101';

    -- Tạo access_credential
    DECLARE @C_BT_ID BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20260622-9901');
    DECLARE @U_BT_ID BIGINT = (SELECT storage_unit_id FROM rental_contract WHERE code = 'CTR-20260622-9901');

    IF NOT EXISTS (SELECT 1 FROM access_credential WHERE contract_id = @C_BT_ID)
    BEGIN
        INSERT INTO access_credential (
            contract_id, storage_unit_id, credential_type, code_value_hash, status, issued_at
        )
        VALUES (
            @C_BT_ID, @U_BT_ID, 'PIN', '112233', 'ACTIVE', SYSDATETIMEOFFSET()
        );
    END;
END;

-- 2. HỢP ĐỒNG QUÁ HẠN D+5 (Cơ sở Quận 1 - Ô Q1-A101)
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-20260625-8802')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RSV-20260625-8802', u.id, f.id, ut.id, su.id,
        '2026-06-25', 3, '2026-09-25', 650000,
        1, 650000, 1950000, 2600000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-Q1'
      AND ut.code = 'UT-SMALL'
      AND su.code = 'Q1-A101'
      AND su.facility_id = f.id;
END;

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260625-8802')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-20260625-8802', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '445566',
        'OVERDUE', r.start_date, r.policy_version_id, 150000
    FROM reservation r
    WHERE r.code = 'RSV-20260625-8802';

    -- Đánh dấu ô kho là OCCUPIED
    UPDATE su
    SET su.status = 'OCCUPIED'
    FROM storage_unit su
    JOIN facility f ON su.facility_id = f.id
    WHERE f.code = 'FAC-Q1' AND su.code = 'Q1-A101';

    -- Tạo access_credential
    DECLARE @C_Q1_ID BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20260625-8802');
    DECLARE @U_Q1_ID BIGINT = (SELECT storage_unit_id FROM rental_contract WHERE code = 'CTR-20260625-8802');

    IF NOT EXISTS (SELECT 1 FROM access_credential WHERE contract_id = @C_Q1_ID)
    BEGIN
        INSERT INTO access_credential (
            contract_id, storage_unit_id, credential_type, code_value_hash, status, issued_at
        )
        VALUES (
            @C_Q1_ID, @U_Q1_ID, 'PIN', '445566', 'ACTIVE', SYSDATETIMEOFFSET()
        );
    END;
END;
