-- ============================================================================
-- V19__seed_demo_customer_nhi_full_lifecycle.sql
-- Seed dữ liệu thực tế toàn diện cho khách hàng Nguyễn Phạm Xuân Nhi (customer_id = 10)
-- 1. Hợp đồng & Đặt chỗ đầy đủ 7 trạng thái nghiệp vụ (Quá khứ, Hiện tại, Tương lai)
--    - ACTIVE: Đang hoạt động thông thường (Q7-S101)
--    - ACTIVE (sắp hết hạn): Còn 5 ngày để kiểm thử cảnh báo gia hạn (CG-S101)
--    - OVERDUE: Quá hạn 4 ngày (D+4) phát sinh phí phạt lũy tiến BR-OVD-02 (Q1-A103)
--    - PENDING_CHECK_IN (Hiện tại): Đã gán ô kho Q1-A101
--    - PENDING_CHECK_IN (Tương lai): Late-binding chưa gán ô kho vật lý (storage_unit_id IS NULL)
--    - PENDING_RETURN: Đã đặt lịch trả kho 3 ngày tới (Q7-L101)
--    - PENDING_PAYMENT: Giữ chỗ 48h chờ thanh toán cọc VietQR (storage_unit_id IS NULL)
--    - CLOSED: Quá khứ đã nghiệm thu trả kho và hoàn cọc 100% (CG-S102)
--    - TERMINATED: Quá khứ thanh lý do quá hạn D+10 theo BR-OVD-07 (CG-M201)
-- 2. Vé sự cố (Support Request) đầy đủ Quá khứ, Hiện tại, Điều chuyển kho kỹ thuật:
--    - IN_PROGRESS: Sự cố khóa điện tử khẩn cấp (LOCK_ACCESS)
--    - NEW: Vấn đề thanh toán / Đối soát nợ phạt (PAYMENT)
--    - RESOLVED: Sự cố dột nước cần chuyển kho (UNIT_DAMAGE, relocation_required = TRUE)
--    - CLOSED: Quá khứ đã giải quyết và khách nghiệm thu hài lòng (LOCK_ACCESS)
-- ============================================================================

-- Xóa dữ liệu cũ nếu đã tồn tại mã demo
DELETE FROM handover_record WHERE contract_id IN (
    SELECT id FROM rental_contract WHERE code IN (
        'CTR-NHI-ACT-01', 'CTR-NHI-ACT-EXP', 'CTR-NHI-OVD-01', 
        'CTR-NHI-CHK-TODAY', 'CTR-NHI-CHK-FUTURE', 'CTR-NHI-RET-01', 
        'CTR-NHI-CLS-2025', 'CTR-NHI-TRM-2025'
    )
);

DELETE FROM return_request WHERE contract_id IN (
    SELECT id FROM rental_contract WHERE code IN (
        'CTR-NHI-ACT-01', 'CTR-NHI-ACT-EXP', 'CTR-NHI-OVD-01', 
        'CTR-NHI-CHK-TODAY', 'CTR-NHI-CHK-FUTURE', 'CTR-NHI-RET-01', 
        'CTR-NHI-CLS-2025', 'CTR-NHI-TRM-2025'
    )
);

DELETE FROM support_request WHERE code IN (
    'SUP-NHI-2026-001', 'SUP-NHI-2026-002', 'SUP-NHI-2026-003', 'SUP-NHI-2025-999'
);

DELETE FROM payment_transaction WHERE contract_id IN (
    SELECT id FROM rental_contract WHERE code IN (
        'CTR-NHI-ACT-01', 'CTR-NHI-ACT-EXP', 'CTR-NHI-OVD-01', 
        'CTR-NHI-CHK-TODAY', 'CTR-NHI-CHK-FUTURE', 'CTR-NHI-RET-01', 
        'CTR-NHI-CLS-2025', 'CTR-NHI-TRM-2025'
    )
) OR reservation_id IN (
    SELECT id FROM reservation WHERE code IN (
        'RES-NHI-ACT-01', 'RES-NHI-ACT-EXP', 'RES-NHI-OVD-01', 
        'RES-NHI-CHK-TODAY', 'RES-NHI-CHK-FUTURE', 'RES-NHI-RET-01', 
        'RES-NHI-HOLD-48H', 'RES-NHI-CLS-2025', 'RES-NHI-TRM-2025'
    )
);

DELETE FROM rental_contract WHERE code IN (
    'CTR-NHI-ACT-01', 'CTR-NHI-ACT-EXP', 'CTR-NHI-OVD-01', 
    'CTR-NHI-CHK-TODAY', 'CTR-NHI-CHK-FUTURE', 'CTR-NHI-RET-01', 
    'CTR-NHI-CLS-2025', 'CTR-NHI-TRM-2025'
);

DELETE FROM reservation WHERE code IN (
    'RES-NHI-ACT-01', 'RES-NHI-ACT-EXP', 'RES-NHI-OVD-01', 
    'RES-NHI-CHK-TODAY', 'RES-NHI-CHK-FUTURE', 'RES-NHI-RET-01', 
    'RES-NHI-HOLD-48H', 'RES-NHI-CLS-2025', 'RES-NHI-TRM-2025'
);

-- ============================================================================
-- 1. SEED RESERVATIONS CHO CUSTOMER 10
-- ============================================================================
INSERT INTO reservation (code, customer_id, facility_id, unit_type_id, start_date, rental_months, end_date_exclusive, monthly_price_snapshot, policy_version_id, deposit_amount, total_rental_fee, total_payable, storage_unit_id, status, hold_expires_at, confirmed_at)
VALUES 
('RES-NHI-ACT-01', 10, 2, 1, CURRENT_DATE - INTERVAL '60 day', 6, CURRENT_DATE + INTERVAL '120 day', 750000, 3, 750000, 4500000, 5250000, 13, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '60 day'),
('RES-NHI-ACT-EXP', 10, 1, 1, CURRENT_DATE - INTERVAL '85 day', 3, CURRENT_DATE + INTERVAL '5 day', 750000, 3, 750000, 2250000, 3000000, 1, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '85 day'),
('RES-NHI-OVD-01', 10, 5, 2, CURRENT_DATE - INTERVAL '94 day', 3, CURRENT_DATE - INTERVAL '4 day', 1500000, 3, 1500000, 4500000, 6000000, 21, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '94 day'),
('RES-NHI-CHK-TODAY', 10, 5, 1, CURRENT_DATE, 3, CURRENT_DATE + INTERVAL '90 day', 750000, 3, 750000, 2250000, 3000000, 19, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('RES-NHI-CHK-FUTURE', 10, 2, 5, CURRENT_DATE + INTERVAL '15 day', 3, CURRENT_DATE + INTERVAL '105 day', 2100000, 3, 2100000, 6300000, 8400000, NULL, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('RES-NHI-RET-01', 10, 2, 3, CURRENT_DATE - INTERVAL '80 day', 3, CURRENT_DATE + INTERVAL '10 day', 2400000, 3, 2400000, 7200000, 9600000, 17, 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP - INTERVAL '80 day'),
('RES-NHI-HOLD-48H', 10, 3, 1, CURRENT_DATE + INTERVAL '5 day', 1, CURRENT_DATE + INTERVAL '35 day', 750000, 3, 750000, 750000, 1500000, NULL, 'PENDING_PAYMENT', CURRENT_TIMESTAMP + INTERVAL '36 hour', NULL),
('RES-NHI-CLS-2025', 10, 1, 1, '2025-10-01', 3, '2026-01-01', 750000, 1, 750000, 2250000, 3000000, 2, 'FULFILLED', '2025-10-01 00:00:00+07', '2025-10-01 00:00:00+07'),
('RES-NHI-TRM-2025', 10, 1, 2, '2025-06-01', 3, '2025-09-01', 1500000, 1, 1500000, 4500000, 6000000, 5, 'FULFILLED', '2025-06-01 00:00:00+07', '2025-06-01 00:00:00+07');

-- ============================================================================
-- 2. SEED RENTAL CONTRACTS TƯƠNG ỨNG
-- ============================================================================
INSERT INTO rental_contract (code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id, start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee, deposit_amount, deposit_balance, access_code, status, checkin_date, policy_version_id, policy_snapshot, activated_at)
VALUES 
(
    'CTR-NHI-ACT-01',
    (SELECT id FROM reservation WHERE code = 'RES-NHI-ACT-01'),
    10, 2, 13, 1,
    CURRENT_DATE - INTERVAL '60 day', CURRENT_DATE + INTERVAL '120 day', 6,
    750000, 4500000, 750000, 750000, '123456', 'ACTIVE',
    CURRENT_DATE - INTERVAL '60 day', 3,
    '{"policyVersionId":3,"checkinGraceDays":10,"accessPinLength":6}',
    CURRENT_TIMESTAMP - INTERVAL '60 day'
),
(
    'CTR-NHI-ACT-EXP',
    (SELECT id FROM reservation WHERE code = 'RES-NHI-ACT-EXP'),
    10, 1, 1, 1,
    CURRENT_DATE - INTERVAL '85 day', CURRENT_DATE + INTERVAL '5 day', 3,
    750000, 2250000, 750000, 750000, '654321', 'ACTIVE',
    CURRENT_DATE - INTERVAL '85 day', 3,
    '{"policyVersionId":3,"checkinGraceDays":10,"accessPinLength":6}',
    CURRENT_TIMESTAMP - INTERVAL '85 day'
);

INSERT INTO rental_contract (code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id, start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee, deposit_amount, deposit_balance, access_code, status, checkin_date, overdue_since, overdue_fee_accrued, policy_version_id, policy_snapshot, activated_at)
VALUES (
    'CTR-NHI-OVD-01',
    (SELECT id FROM reservation WHERE code = 'RES-NHI-OVD-01'),
    10, 5, 21, 2,
    CURRENT_DATE - INTERVAL '94 day', CURRENT_DATE - INTERVAL '4 day', 3,
    1500000, 4500000, 1500000, 1500000, '112233', 'OVERDUE',
    CURRENT_DATE - INTERVAL '94 day', CURRENT_DATE - INTERVAL '4 day', 400000, 3,
    '{"policyVersionId":3,"checkinGraceDays":10,"accessPinLength":6}',
    CURRENT_TIMESTAMP - INTERVAL '94 day'
);

INSERT INTO rental_contract (code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id, start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee, deposit_amount, deposit_balance, status, policy_version_id, policy_snapshot)
VALUES 
(
    'CTR-NHI-CHK-TODAY',
    (SELECT id FROM reservation WHERE code = 'RES-NHI-CHK-TODAY'),
    10, 5, 19, 1,
    CURRENT_DATE, CURRENT_DATE + INTERVAL '90 day', 3,
    750000, 2250000, 750000, 750000, 'PENDING_CHECK_IN', 3,
    '{"policyVersionId":3,"checkinGraceDays":10,"accessPinLength":6}'
),
(
    'CTR-NHI-CHK-FUTURE',
    (SELECT id FROM reservation WHERE code = 'RES-NHI-CHK-FUTURE'),
    10, 2, NULL, 5,
    CURRENT_DATE + INTERVAL '15 day', CURRENT_DATE + INTERVAL '105 day', 3,
    2100000, 6300000, 2100000, 2100000, 'PENDING_CHECK_IN', 3,
    '{"policyVersionId":3,"checkinGraceDays":10,"accessPinLength":6}'
);

INSERT INTO rental_contract (code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id, start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee, deposit_amount, deposit_balance, access_code, status, checkin_date, policy_version_id, policy_snapshot, activated_at)
VALUES (
    'CTR-NHI-RET-01',
    (SELECT id FROM reservation WHERE code = 'RES-NHI-RET-01'),
    10, 2, 17, 3,
    CURRENT_DATE - INTERVAL '80 day', CURRENT_DATE + INTERVAL '10 day', 3,
    2400000, 7200000, 2400000, 2400000, '334455', 'PENDING_RETURN',
    CURRENT_DATE - INTERVAL '80 day', 3,
    '{"policyVersionId":3,"checkinGraceDays":10,"accessPinLength":6}',
    CURRENT_TIMESTAMP - INTERVAL '80 day'
);

INSERT INTO rental_contract (code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id, start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee, deposit_amount, deposit_balance, access_code, status, checkin_date, return_date, closed_at, policy_version_id, policy_snapshot, activated_at)
VALUES (
    'CTR-NHI-CLS-2025',
    (SELECT id FROM reservation WHERE code = 'RES-NHI-CLS-2025'),
    10, 1, 2, 1,
    '2025-10-01', '2026-01-01', 3,
    750000, 2250000, 750000, 0, '123123', 'CLOSED',
    '2025-10-01', '2026-01-01', '2026-01-02 10:00:00+07', 1,
    '{"policyVersionId":1,"checkinGraceDays":10,"accessPinLength":6}',
    '2025-10-01 10:00:00+07'
);

INSERT INTO rental_contract (code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id, start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee, deposit_amount, deposit_balance, access_code, status, checkin_date, terminated_at, policy_version_id, policy_snapshot, activated_at)
VALUES (
    'CTR-NHI-TRM-2025',
    (SELECT id FROM reservation WHERE code = 'RES-NHI-TRM-2025'),
    10, 1, 5, 2,
    '2025-06-01', '2025-09-01', 3,
    1500000, 4500000, 1500000, 0, '456456', 'TERMINATED',
    '2025-06-01', '2025-09-12 18:00:00+07', 1,
    '{"policyVersionId":1,"checkinGraceDays":10,"accessPinLength":6}',
    '2025-06-01 10:00:00+07'
);

-- ============================================================================
-- 3. CẬP NHẬT TRẠNG THÁI Ô KHO VẬT LÝ TƯƠNG ỨNG
-- ============================================================================
UPDATE storage_unit SET status = 'OCCUPIED' WHERE id IN (13, 1, 21, 17);
UPDATE storage_unit SET status = 'RESERVED' WHERE id IN (19);
UPDATE storage_unit SET status = 'AVAILABLE' WHERE id IN (2, 5);

-- ============================================================================
-- 4. BIÊN BẢN BÀN GIAO & YÊU CẦU TRẢ KHO & GIAO DỊCH
-- ============================================================================
INSERT INTO handover_record (contract_id, staff_id, condition_note, customer_confirmed, customer_confirmed_at, status, handover_at)
VALUES 
(
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-ACT-01'),
    9, 'Ô kho sạch đẹp, khóa thông minh kiểm tra hoạt động tốt, tường và sàn kho khô ráo.',
    TRUE, CURRENT_TIMESTAMP - INTERVAL '60 day', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '60 day'
),
(
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-ACT-EXP'),
    2, 'Bàn giao ô kho tiêu chuẩn sạch sẽ, đầy đủ trang thiết bị PCCC.',
    TRUE, CURRENT_TIMESTAMP - INTERVAL '85 day', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '85 day'
);

INSERT INTO return_request (contract_id, requested_return_date, appointment_slot, status, requested_at)
VALUES (
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-RET-01'),
    CURRENT_DATE + INTERVAL '3 day', '09:00 - 11:00', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '1 day'
);

INSERT INTO return_request (contract_id, requested_return_date, appointment_slot, status, inspected_by, inspected_at, is_intact, condition_note, damage_cost, deposit_refund_amount, customer_confirmed, customer_confirmed_at, settled_by, settled_at)
VALUES (
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-CLS-2025'),
    '2026-01-01', '14:00 - 16:00', 'COMPLETED',
    2, '2026-01-01 15:00:00+07', TRUE, 'Kho hoàn trả nguyên vẹn, vệ sinh sạch sẽ, không có bất kỳ hư hại nào.',
    0, 750000, TRUE, '2026-01-01 15:30:00+07', 3, '2026-01-02 10:00:00+07'
);

INSERT INTO payment_transaction (contract_id, reservation_id, transaction_type, amount, status, payment_method, provider_reference, created_at)
VALUES (
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-CLS-2025'),
    (SELECT id FROM reservation WHERE code = 'RES-NHI-CLS-2025'),
    'REFUND', 750000, 'SUCCESS', 'BANK_TRANSFER', 'REFUND-2026-0102-9988', '2026-01-02 10:05:00+07'
);

-- ============================================================================
-- 5. SEED VÉ HỖ TRỢ & SỰ CỐ (SUPPORT_REQUEST)
-- ============================================================================
INSERT INTO support_request (code, customer_id, contract_id, storage_unit_id, category, description, status, assigned_staff_id, sla_due_at, created_at)
VALUES 
(
    'SUP-NHI-2026-001', 10,
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-ACT-01'),
    13, 'LOCK_ACCESS',
    'Bàn phím khóa điện tử không nhận diện phím # để mở chốt cửa kho, cần kỹ thuật hỗ trợ tại chỗ gấp.',
    'IN_PROGRESS', 9, CURRENT_TIMESTAMP + INTERVAL '2 hour', CURRENT_TIMESTAMP - INTERVAL '30 minute'
),
(
    'SUP-NHI-2026-002', 10,
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-OVD-01'),
    21, 'PAYMENT',
    'Em đã chuyển khoản VietQR nộp phạt lúc 9h sáng nay nhưng hệ thống chưa tự động gỡ cảnh báo, nhờ kế toán kiểm tra đối soát giúp em.',
    'NEW', NULL, CURRENT_TIMESTAMP + INTERVAL '8 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour'
);

INSERT INTO support_request (code, customer_id, contract_id, storage_unit_id, category, description, status, assigned_staff_id, sla_due_at, resolved_at, resolution_note, customer_notice, relocation_required, created_at)
VALUES (
    'SUP-NHI-2026-003', 10,
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-ACT-01'),
    13, 'UNIT_DAMAGE',
    'Tường kho có hiện tượng ẩm do mưa to, đề nghị hỗ trợ chuyển đồ sang kho khô ráo lân cận (BR-SUP-02).',
    'RESOLVED', 9, CURRENT_TIMESTAMP + INTERVAL '12 hour',
    CURRENT_TIMESTAMP - INTERVAL '45 minute',
    'Nhân viên kỹ thuật đã kiểm tra hiện trường và hỗ trợ khách hàng điều chuyển tài sản sang ô kho mới an toàn.',
    'Đã hoàn tất hỗ trợ điều chuyển kho. Quý khách vui lòng kiểm tra tài sản và bấm Xác nhận hài lòng trên ứng dụng.',
    TRUE, CURRENT_TIMESTAMP - INTERVAL '5 hour'
);

INSERT INTO support_request (code, customer_id, contract_id, storage_unit_id, category, description, status, assigned_staff_id, sla_due_at, resolved_at, customer_confirmed_at, resolution_note, created_at)
VALUES (
    'SUP-NHI-2025-999', 10,
    (SELECT id FROM rental_contract WHERE code = 'CTR-NHI-CLS-2025'),
    2, 'LOCK_ACCESS',
    'Em quên mã PIN cũ khi tới lấy hàng, nhờ cấp lại mã tạm thời.',
    'CLOSED', 2, '2025-12-10 16:00:00+07',
    '2025-12-10 14:00:00+07', '2025-12-10 14:30:00+07',
    'Đã xác minh CCCD và cấp mã OTP mở cửa khẩn cấp thành công.',
    '2025-12-10 13:00:00+07'
);

