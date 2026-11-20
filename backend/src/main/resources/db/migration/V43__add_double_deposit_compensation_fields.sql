-- ==============================================================================
-- Migration V43: Bổ sung trường Bồi thường Phạt cọc Gấp đôi (BR-BMP-02 / Điều 328 BLDS)
-- & Seed Kịch bản Demo Cháy Kho 100% Cấp 3 (Kho Máy Lạnh XL duy nhất 1 ô)
-- ==============================================================================

-- 1. Thêm các cột bồi thường phạt cọc vào rental_contract
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS is_double_deposit_compensation BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS compensation_amount BIGINT NOT NULL DEFAULT 0;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS compensation_reason TEXT NULL;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS compensation_approved_by BIGINT NULL;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS compensation_approved_at TIMESTAMPTZ NULL;

-- 2. Cập nhật ràng buộc loại giao dịch trong payment_transaction (bổ sung COMPENSATION)
ALTER TABLE payment_transaction DROP CONSTRAINT IF EXISTS ck_payment_transaction_type;

ALTER TABLE payment_transaction
    ADD CONSTRAINT ck_payment_transaction_type CHECK (transaction_type IN (
        'INITIAL_PAYMENT',
        'RENEWAL_PAYMENT',
        'EXTRA_FEE_PAYMENT',
        'REFUND',
        'RENT_REFUND',
        'DEPOSIT_REFUND',
        'CONTRACT_RENEWAL',
        'OVERDUE_PENALTY',
        'RESCHEDULE_FEE',
        'SETTLEMENT',
        'COMPENSATION'
    ));

-- 3. Cấu hình Kịch bản Demo Cháy kho 100% tại Cơ sở Quận 7 (FAC-Q7, facility_id = 2):
--    - Loại kho cao cấp nhất: Kho Máy Lạnh XL (unit_type_id = 10, diện tích 100m²).
--      Vì đây là hạng kho lớn nhất toàn hệ thống, KHÔNG THỂ nâng hạng lên bất kỳ loại nào khác!
--    - Thiết lập đúng DUY NHẤT 1 ô vật lý: Q7-AC-XL101.
--    - Chuyển tất cả các ô UT-AC-XL khác tại Cơ sở 2 sang MAINTENANCE.

INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES (2, 10, 'Q7-AC-XL101', 1, 'Khu D', 'Tầng 1 - Khu VIP - Kho lạnh doanh nghiệp cao cấp 100m²', 'AVAILABLE')
ON CONFLICT (facility_id, code) DO UPDATE
SET status = 'AVAILABLE',
    unit_type_id = 10,
    floor = 1,
    position = 'Khu D',
    location_note = 'Tầng 1 - Khu VIP - Kho lạnh doanh nghiệp cao cấp 100m²';

-- Đưa tất cả các ô khác của loại UT-AC-XL tại Cơ sở 2 sang MAINTENANCE
UPDATE storage_unit
SET status = 'MAINTENANCE'
WHERE facility_id = 2
  AND unit_type_id = 10
  AND code <> 'Q7-AC-XL101';

-- 4. Seed Đơn đặt chỗ & Hợp đồng chờ nhận kho mẫu phục vụ Demo 1-Click:
--    Mã hợp đồng: CTR-DEMO-DOUBLE-DEPOSIT
--    Khách hàng: Nguyễn Phạm Xuân Nhi / Lê Thanh Tùng
--    Gắn ô: Q7-AC-XL101
--    Tiền thuê: 24.000.000 đ | Tiền cọc: 24.000.000 đ | Tổng đã đóng: 48.000.000 đ
DO $$
DECLARE
    v_customer_id BIGINT;
    v_unit_id BIGINT;
    v_res_id BIGINT;
    v_contract_id BIGINT;
BEGIN
    SELECT id INTO v_customer_id FROM app_user WHERE email = 'xuannhi.nguyenpham@gmail.com' LIMIT 1;
    IF v_customer_id IS NULL THEN
        SELECT id INTO v_customer_id FROM app_user WHERE role = 'STORAGE_CUSTOMER' LIMIT 1;
    END IF;

    SELECT id INTO v_unit_id FROM storage_unit WHERE facility_id = 2 AND code = 'Q7-AC-XL101' LIMIT 1;

    -- Xóa dữ liệu demo cũ nếu có để đảm bảo idempotent
    DELETE FROM payment_transaction WHERE order_code = 99998888;
    DELETE FROM rental_contract WHERE code = 'CTR-DEMO-DOUBLE-DEPOSIT';
    DELETE FROM reservation WHERE code = 'RES-DEMO-DOUBLE-DEPOSIT';

    -- Tạo Đơn đặt chỗ (Reservation)
    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, start_date, rental_months,
        end_date_exclusive, monthly_price_snapshot, policy_version_id, discount_program_id,
        discount_amount, deposit_amount, total_rental_fee, total_payable, storage_unit_id,
        status, hold_expires_at, confirmed_at, created_at, updated_at
    ) VALUES (
        'RES-DEMO-DOUBLE-DEPOSIT', v_customer_id, 2, 10, CURRENT_DATE, 1,
        CURRENT_DATE + INTERVAL '1 month', 24000000, 1, NULL,
        0, 24000000, 24000000, 48000000, v_unit_id,
        'CONFIRMED', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO v_res_id;

    -- Tạo Hợp đồng chờ nhận kho (Rental Contract)
    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee,
        deposit_amount, deposit_balance, access_code, status, checkin_date,
        scheduled_start_time, scheduled_end_time, policy_version_id, overdue_fee_accrued,
        customer_name, customer_phone, customer_email, customer_identity_number,
        is_upgraded_compensation, is_double_deposit_compensation, compensation_amount,
        created_at, updated_at
    ) VALUES (
        'CTR-DEMO-DOUBLE-DEPOSIT', v_res_id, v_customer_id, 2, v_unit_id, 10,
        CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', 1, 24000000, 24000000,
        24000000, 24000000, 'PIN-9999', 'PENDING_CHECK_IN', CURRENT_DATE,
        '08:00:00'::time, '18:00:00'::time, 1, 0,
        'Nguyễn Phạm Xuân Nhi', '0973499377', 'xuannhi.nguyenpham@gmail.com', '051306007726',
        FALSE, FALSE, 0,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id INTO v_contract_id;

    -- Tạo Giao dịch thanh toán ban đầu (48.000.000 đ = 24tr thuê + 24tr cọc)
    INSERT INTO payment_transaction (
        reservation_id, contract_id, transaction_type, amount, order_code,
        status, payment_method, provider_reference, paid_at, created_at, updated_at
    ) VALUES (
        v_res_id, v_contract_id, 'INITIAL_PAYMENT', 48000000, 99998888,
        'SUCCESS', 'VNPAY', 'VNPAY-DEMO-COMPENSATION', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );

END $$;
