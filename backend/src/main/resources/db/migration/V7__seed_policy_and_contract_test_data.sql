-- V7__seed_policy_and_contract_test_data.sql
-- Seed baseline policy_version, sample reservation, and active rental_contract for testing & operational workflows

IF NOT EXISTS (SELECT 1 FROM policy_version WHERE version_no = 1)
BEGIN
    INSERT INTO policy_version (
        version_no, effective_from, deposit_multiplier, reservation_hold_hours,
        checkin_grace_days, cancel_full_refund_hours, cancel_late_refund_rate,
        cancel_no_show_refund_rate, renewal_reminder_days, renewal_min_months,
        renewal_max_months, overdue_grace_days, overdue_daily_rate, overdue_cap_rate,
        overdue_lock_access_days, overdue_notice_days, overdue_termination_days,
        return_notice_days, return_refund_working_days, return_early_refund_rate,
        access_pin_length, support_urgent_sla_hours, support_auto_close_working_days,
        published_by
    )
    SELECT
        1, SYSDATETIMEOFFSET(), 1.0, 48,
        10, 48, 0.5, 0.0,
        '60,7,3,1', 1, 12,
        3, 0.1, 0.7,
        10, 4, 10,
        30, 7, 0.0,
        6, 2, 7,
        u.id
    FROM app_user u WHERE u.email = 'bom@storage.vn';
END
GO

IF NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RES-202610-0001')
BEGIN
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at
    )
    SELECT
        'RES-202610-0001', u.id, f.id, ut.id, su.id,
        '2026-10-01', 3, '2027-01-01', 500000,
        pv.id, 500000, 1500000, 2000000,
        'CONFIRMED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET())
    FROM app_user u, facility f, unit_type ut, storage_unit su, policy_version pv
    WHERE u.email = 'customer@storage.vn'
      AND f.code = 'FAC-CG'
      AND ut.code = 'UT-SMALL'
      AND su.code = 'CG-S101'
      AND pv.version_no = 1;
END
GO

IF NOT EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-202610-0001')
BEGIN
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, policy_version_id, monthly_price_snapshot,
        deposit_amount, deposit_balance, rental_months, total_rental_fee,
        status, access_code, overdue_fee_accrued
    )
    SELECT
        'CTR-202610-0001', r.id, r.customer_id, r.facility_id, r.storage_unit_id, r.unit_type_id,
        r.start_date, r.end_date_exclusive, r.policy_version_id, r.monthly_price_snapshot,
        r.deposit_amount, r.deposit_amount, r.rental_months, r.total_rental_fee,
        'ACTIVE', '123456', 0
    FROM reservation r
    WHERE r.code = 'RES-202610-0001';
END
GO
