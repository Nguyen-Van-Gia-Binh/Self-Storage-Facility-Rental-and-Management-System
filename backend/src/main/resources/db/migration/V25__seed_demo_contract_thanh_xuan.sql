/* ============================================================================
   Flyway Migration V25__seed_demo_contract_thanh_xuan.sql
   Bổ sung Hợp đồng thuê thực tế cho ô kho TX-A104 tại Cơ sở Thanh Xuân (FAC-TX)
   từ ngày 2026-09-01 đến 2027-01-01 (4 tháng).
   Phục vụ kiểm thử logic tính toán tính khả dụng động theo thời gian thuê (SC-01, SC-02):
   - Trước 2027-01-01: TX-A104 hiển thị ĐANG THUÊ (OCCUPIED).
   - Từ 2027-01-01 trở đi: TX-A104 tự động hiển thị CÒN TRỐNG (AVAILABLE) để khách đặt trước.
   ============================================================================ */

-- 1. Đảm bảo trạng thái của ô TX-A104 tại Thanh Xuân là OCCUPIED
UPDATE su
SET su.status = 'OCCUPIED'
FROM storage_unit su
JOIN facility f ON su.facility_id = f.id
WHERE f.code = 'FAC-TX' AND su.code = 'TX-A104';

-- 2. Thêm đơn reservation fulfilled mẫu nếu chưa có
IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-DEMO-TX-104')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    SELECT
        'RES-DEMO-TX-104', u.id, f.id, ut.id, su.id,
        '2026-09-01', 4, '2027-01-01', 1150000,
        pv.id, 1150000, 4600000, 5750000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'nhi.customer@gmail.com'
      AND f.code = 'FAC-TX'
      AND ut.code = 'UT-MEDIUM'
      AND su.code = 'TX-A104'
      AND su.facility_id = f.id
      AND pv.version_no = 1;
END;

-- 3. Thêm hợp đồng thuê ACTIVE cho TX-A104 (từ 2026-09-01 đến 2027-01-01)
IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-DEMO-TX-104')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    SELECT
        'CTR-DEMO-TX-104', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.rental_months, r.monthly_price_snapshot,
        r.total_rental_fee, r.deposit_amount, r.deposit_amount, '654321',
        'ACTIVE', r.start_date, r.policy_version_id, 0
    FROM reservation r
    WHERE r.code = 'RES-DEMO-TX-104';
END;
