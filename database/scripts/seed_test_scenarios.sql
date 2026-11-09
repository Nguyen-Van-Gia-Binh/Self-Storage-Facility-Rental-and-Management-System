-- =============================================================================
-- SCRIPT SEED DỮ LIỆU KIỂM THỬ TOÀN DIỆN HỆ THỐNG (MASTER TEST SCENARIOS)
-- Đường dẫn: database/scripts/seed_test_scenarios.sql
-- Tác giả: Nguyễn Văn Gia Bình (WS2 Lead - SWP391)
--
-- Mục tiêu: Cung cấp các Kịch bản Thử nghiệm Vàng (Golden Test Scenarios)
--           bao phủ các Flow nghiệp vụ trọng yếu (Trả kho, Quá hạn, Đặt chỗ, Check-in).
--
-- Đặc điểm: IDEMPOTENT (Chạy lại nhiều lần an toàn, tự động dọn dẹp data test cũ).
--
-- Tài khoản Demo sử dụng:
--   - Khách thuê (Customer): nhi.customer@gmail.com / password123 (ID: 10)
--   - Quản lý cơ sở (FM)   : fm.q1@smartstorage.vn / password123 (ID: 8 - Gia Bình)
--   - Nhân viên cơ sở (FS) : staff.q1@smartstorage.vn / password123 (ID: 9)
--   - Cơ sở áp dụng        : Cơ sở Quận 1 - TP.HCM (ID: 5, Mã: FAC-Q1)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- BƯỚC 1: DỌN DẸP SẠCH TOÀN BỘ DỮ LIỆU GIAO DỊCH (GLOBAL CLEAN SLATE RESET)
-- Giữ nguyên Dữ liệu Nền tảng (Users, Cơ sở, Loại kho, Bảng giá, Chính sách, BOM phí).
-- Quét sạch mọi Hợp đồng, Đơn đặt chỗ, Thanh toán, Trả kho, Bàn giao... phát sinh cũ.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- 1.0 Gỡ liên kết waitlist & xóa sạch waitlist
    UPDATE waitlist SET converted_contract_id = NULL, converted_reservation_id = NULL;
    DELETE FROM waitlist;

    -- 1.1 Xóa phụ phí phát sinh (contract_extra_charge)
    DELETE FROM contract_extra_charge;

    -- 1.2 Xóa yêu cầu trả kho & quyết toán (return_request)
    DELETE FROM return_request;

    -- 1.3 Xóa gia hạn hợp đồng (contract_renewal)
    DELETE FROM contract_renewal;

    -- 1.4 Xóa yêu cầu điều chỉnh phí quá hạn (overdue_fee_adjustment_request)
    DELETE FROM overdue_fee_adjustment_request;

    -- 1.5 Xóa access_credential & access_log
    DELETE FROM access_log;
    DELETE FROM access_credential;

    -- 1.6 Xóa biên bản bàn giao (handover_record)
    DELETE FROM handover_record;

    -- 1.7 Xóa file đính kèm & yêu cầu hỗ trợ (attachment & support_request)
    DELETE FROM attachment;
    DELETE FROM support_request;

    -- 1.8 Xóa sổ cái kế toán & lịch sử giao dịch thanh toán (ledger_entry & payment_transaction)
    DELETE FROM ledger_entry;
    DELETE FROM payment_transaction;

    -- 1.9 Xóa toàn bộ hợp đồng thuê kho (rental_contract)
    DELETE FROM rental_contract;

    -- 1.10 Xóa toàn bộ đơn đặt chỗ (reservation)
    DELETE FROM reservation;

    -- 1.11 Đưa TẤT CẢ các ô kho vật lý (storage_unit) toàn hệ thống về trạng thái AVAILABLE
    UPDATE storage_unit SET status = 'AVAILABLE';

    -- 1.12 Chuẩn hóa trạng thái cơ sở: Chỉ 3 cơ sở trọng điểm ACTIVE (1: CG, 2: Q7, 5: Q1)
    UPDATE facility SET status = 'ACTIVE' WHERE id IN (1, 2, 5);
    UPDATE facility SET status = 'INACTIVE' WHERE id NOT IN (1, 2, 5);

    RAISE NOTICE '>>> [BUOC 1] Da thuc hien Global Clean Slate: Quet sach toan bo du lieu giao dich cu va giai phong 100%% o kho ve AVAILABLE thanh cong.';
END $$;

-- -----------------------------------------------------------------------------
-- BƯỚC 2: TẠO 8 ĐƠN ĐẶT CHỖ MẪU (RESERVATION TEST 9001..9008)
-- -----------------------------------------------------------------------------
INSERT INTO reservation (
    id, code, customer_id, facility_id, unit_type_id, storage_unit_id,
    start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
    policy_version_id, deposit_amount, total_rental_fee, total_payable,
    status, hold_expires_at, confirmed_at, fulfilled_at
)
VALUES
-- RES 9001: Cho HĐ CTR-TEST-001 (Kho Q1-A101, UT-SMALL)
(9001, 'RES-TEST-001', 10, 5, 1, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A101'),
 CURRENT_DATE - INTERVAL '30 day', 3, CURRENT_DATE + INTERVAL '60 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9002: Cho HĐ CTR-TEST-002 (Kho Q1-A102, UT-SMALL)
(9002, 'RES-TEST-002', 10, 5, 1, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A102'),
 CURRENT_DATE - INTERVAL '80 day', 3, CURRENT_DATE + INTERVAL '10 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9003: Cho HĐ CTR-TEST-003 (Kho Q1-A103, UT-MEDIUM)
(9003, 'RES-TEST-003', 10, 5, 2, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A103'),
 CURRENT_DATE - INTERVAL '90 day', 3, CURRENT_DATE - INTERVAL '1 day', 1600000,
 1, 1600000, 4800000, 6400000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9004: Cho HĐ CTR-TEST-004 (Kho Q1-B201, UT-LARGE)
(9004, 'RES-TEST-004', 10, 5, 3, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B201'),
 CURRENT_DATE - INTERVAL '180 day', 6, CURRENT_DATE - INTERVAL '2 day', 2000000,
 1, 2000000, 12000000, 14000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9005: Cho HĐ CTR-TEST-005 (Kho Q1-C101, UT-CLIMATE)
(9005, 'RES-TEST-005', 10, 5, 4, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-C101'),
 CURRENT_DATE - INTERVAL '92 day', 3, CURRENT_DATE - INTERVAL '2 day', 1500000,
 1, 1500000, 4500000, 6000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9006: Cho HĐ CTR-TEST-006 (Kho Q1-XS101, UT-SMALL)
(9006, 'RES-TEST-006', 10, 5, 1, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XS101'),
 CURRENT_DATE - INTERVAL '95 day', 3, CURRENT_DATE - INTERVAL '5 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9007: Cho HĐ CTR-TEST-007 (Kho Q1-XL101, UT-LARGE)
(9007, 'RES-TEST-007', 10, 5, 3, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XL101'),
 CURRENT_DATE - INTERVAL '98 day', 3, CURRENT_DATE - INTERVAL '8 day', 2500000,
 1, 2500000, 7500000, 10000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9008: Cho HĐ CTR-TEST-008 (Kho Q1-XS201, UT-SMALL)
(9008, 'RES-TEST-008', 10, 5, 1, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XS201'),
 CURRENT_DATE - INTERVAL '135 day', 3, CURRENT_DATE - INTERVAL '45 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- BƯỚC 3: TẠO 8 HỢP ĐỒNG THỬ NGHIỆM TRỌNG YẾU (RENTAL_CONTRACT 9001..9008)
-- -----------------------------------------------------------------------------
INSERT INTO rental_contract (
    id, code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
    start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee,
    deposit_amount, deposit_balance, access_code, status, checkin_date, policy_version_id,
    overdue_fee_accrued, activated_at, terminated_at, closed_at
)
VALUES
-- Case 1: CTR-TEST-001 (ACTIVE Hạn dài > 30 ngày) -> Test Báo trả sớm trước hạn dài (BR-RET-06)
(9001, 'CTR-TEST-001', 9001, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A101'), 1,
 CURRENT_DATE - INTERVAL '30 day', CURRENT_DATE + INTERVAL '60 day', 3, 1000000, 3000000,
 1000000, 1000000, '123456', 'ACTIVE', CURRENT_DATE - INTERVAL '30 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '30 day', NULL, NULL),

-- Case 2: CTR-TEST-002 (ACTIVE Tháng cuối <= 30 ngày) -> Test Báo trả đúng hạn/tháng cuối (UC-F3-01A)
(9002, 'CTR-TEST-002', 9002, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A102'), 1,
 CURRENT_DATE - INTERVAL '80 day', CURRENT_DATE + INTERVAL '10 day', 3, 1000000, 3000000,
 1000000, 1000000, '123456', 'ACTIVE', CURRENT_DATE - INTERVAL '80 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '80 day', NULL, NULL),

-- Case 3: CTR-TEST-003 (PENDING_RETURN Chờ nghiệm thu) -> Test Hủy yêu cầu (BR-RET-12) & Staff nghiệm thu (UC-F3-06)
(9003, 'CTR-TEST-003', 9003, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A103'), 2,
 CURRENT_DATE - INTERVAL '90 day', CURRENT_DATE - INTERVAL '1 day', 3, 1600000, 4800000,
 1600000, 1600000, NULL, 'PENDING_RETURN', CURRENT_DATE - INTERVAL '90 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '90 day', NULL, NULL),

-- Case 4: CTR-TEST-004 (PENDING_RETURN Đã nghiệm thu có hư hại) -> Test FM duyệt quyết toán cọc (UC-F3-07)
(9004, 'CTR-TEST-004', 9004, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B201'), 3,
 CURRENT_DATE - INTERVAL '180 day', CURRENT_DATE - INTERVAL '2 day', 6, 2000000, 12000000,
 2000000, 2000000, NULL, 'PENDING_RETURN', CURRENT_DATE - INTERVAL '180 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '180 day', NULL, NULL),

-- Case 5: CTR-TEST-005 (OVERDUE D+2 - Giai đoạn 1) -> Khóa PIN D+1 (BR-OVD-01), thu 5%/ngày (BR-OVD-02), Quét QR nhận PIN tạm (BR-OVD-08)
(9005, 'CTR-TEST-005', 9005, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-C101'), 4,
 CURRENT_DATE - INTERVAL '92 day', CURRENT_DATE - INTERVAL '2 day', 3, 1500000, 4500000,
 1500000, 1500000, NULL, 'OVERDUE', CURRENT_DATE - INTERVAL '92 day', 1,
 150000, CURRENT_TIMESTAMP - INTERVAL '92 day', NULL, NULL),

-- Case 6: CTR-TEST-006 (OVERDUE D+5 - Giai đoạn 2) -> Phạt 10%/ngày (BR-OVD-03), Chốt chặn No Pay, No PIN, Chặn báo trả kho (TC-F3-01D)
(9006, 'CTR-TEST-006', 9006, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XS101'), 1,
 CURRENT_DATE - INTERVAL '95 day', CURRENT_DATE - INTERVAL '5 day', 3, 1000000, 3000000,
 1000000, 1000000, NULL, 'OVERDUE', CURRENT_DATE - INTERVAL '95 day', 1,
 350000, CURRENT_TIMESTAMP - INTERVAL '95 day', NULL, NULL),

-- Case 7: CTR-TEST-007 (TERMINATED D+8 - Giai đoạn 3) -> Tịch thu 100% cọc niêm phong về Kho Tổng (BR-OVD-07), Test FM quyết toán Kho Tổng (BR-OVD-11)
(9007, 'CTR-TEST-007', 9007, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XL101'), 3,
 CURRENT_DATE - INTERVAL '98 day', CURRENT_DATE - INTERVAL '8 day', 3, 2500000, 7500000,
 2500000, 0, NULL, 'TERMINATED', CURRENT_DATE - INTERVAL '98 day', 1,
 1375000, CURRENT_TIMESTAMP - INTERVAL '98 day', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL),

-- Case 8: CTR-TEST-008 (CLOSED Đã đóng tất toán) -> Test đối chứng lịch sử, không có nút trả kho (TC-F3-01E)
(9008, 'CTR-TEST-008', 9008, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XS201'), 1,
 CURRENT_DATE - INTERVAL '135 day', CURRENT_DATE - INTERVAL '45 day', 3, 1000000, 3000000,
 1000000, 0, NULL, 'CLOSED', CURRENT_DATE - INTERVAL '135 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '135 day', NULL, CURRENT_TIMESTAMP - INTERVAL '40 day')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- BƯỚC 4: THIẾT LẬP DỮ LIỆU ĐI KÈM CHO CÁC CASE ĐẶC BIỆT (RETURN & SURCHARGES)
-- -----------------------------------------------------------------------------
-- 4.1 Case 3 (CTR-TEST-003): Tạo yêu cầu trả kho đang chờ nghiệm thu
INSERT INTO return_request (
    contract_id, requested_at, requested_return_date, appointment_slot,
    status, inspected_by, inspected_at, is_intact, damage_cost
)
VALUES (
    9003, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_DATE, '09:00 - 11:00',
    'PENDING', NULL, NULL, NULL, 0
);

-- 4.2 Case 4 (CTR-TEST-004): Tạo biên bản đã nghiệm thu có hư hỏng BOM
INSERT INTO return_request (
    contract_id, requested_at, requested_return_date, appointment_slot,
    status, inspected_by, inspected_at, is_intact, damage_cost, condition_note, customer_confirmed
)
VALUES (
    9004, CURRENT_TIMESTAMP - INTERVAL '2 day', CURRENT_DATE - INTERVAL '1 day', '14:00 - 16:00',
    'PENDING', 9, CURRENT_TIMESTAMP - INTERVAL '3 hour', FALSE, 500000,
    'Hư hại nhẹ ổ khóa và xước thanh ray cửa cuốn', TRUE
);

-- 4.3 Case 4 (CTR-TEST-004): Gắn phụ phí hư hại BOM (500.000đ)
INSERT INTO contract_extra_charge (
    contract_id, extra_fee_type_id, amount, reason, recorded_by, status
)
VALUES (
    9004, 3, 500000, 'Phí sửa chữa ổ khóa cửa cuốn (Mã BOM: DAMAGE_MINOR)', 9, 'UNPAID'
);

-- 4.4 Thêm biên bản bàn giao nhận kho chuẩn (Handover Record) cho các hợp đồng đã check-in
INSERT INTO handover_record (
    contract_id, staff_id, condition_note, customer_signed_at, staff_signed_at,
    status, customer_confirmed, customer_confirmed_at, rejected
)
VALUES
(9001, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '30 day', CURRENT_TIMESTAMP - INTERVAL '30 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '30 day', FALSE),
(9002, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '80 day', CURRENT_TIMESTAMP - INTERVAL '80 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '80 day', FALSE),
(9003, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '90 day', CURRENT_TIMESTAMP - INTERVAL '90 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '90 day', FALSE),
(9004, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '180 day', CURRENT_TIMESTAMP - INTERVAL '180 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '180 day', FALSE),
(9005, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '92 day', CURRENT_TIMESTAMP - INTERVAL '92 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '92 day', FALSE),
(9006, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '95 day', CURRENT_TIMESTAMP - INTERVAL '95 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '95 day', FALSE),
(9007, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao lúc nhận kho ban đầu. Hợp đồng sau đó phát sinh quá hạn D+7.', CURRENT_TIMESTAMP - INTERVAL '98 day', CURRENT_TIMESTAMP - INTERVAL '98 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '98 day', FALSE),
(9008, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Hợp đồng đã hoàn tất chu kỳ thuê.', CURRENT_TIMESTAMP - INTERVAL '135 day', CURRENT_TIMESTAMP - INTERVAL '135 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '135 day', FALSE)
ON CONFLICT (contract_id) DO UPDATE SET
    rejected = EXCLUDED.rejected,
    condition_note = EXCLUDED.condition_note,
    status = EXCLUDED.status,
    customer_confirmed = EXCLUDED.customer_confirmed;

-- -----------------------------------------------------------------------------
-- BƯỚC 5: ĐỒNG BỘ TRẠNG THÁI Ô KHO VẬT LÝ (STORAGE_UNIT)
-- -----------------------------------------------------------------------------
UPDATE storage_unit SET status = 'OCCUPIED'   WHERE facility_id = 5 AND code IN ('Q1-A101', 'Q1-A102', 'Q1-A103', 'Q1-C101', 'Q1-XS101', 'Q1-B201');
UPDATE storage_unit SET status = 'MAINTENANCE'WHERE facility_id = 5 AND code = 'Q1-XL101';
UPDATE storage_unit SET status = 'AVAILABLE'  WHERE facility_id = 5 AND code = 'Q1-XS201';

-- Tất cả các ô kho còn lại của Cơ sở 5 (phục vụ khách thuê mới Flow 1, Flow 2) đều ở trạng thái AVAILABLE
UPDATE storage_unit 
SET status = 'AVAILABLE' 
WHERE facility_id = 5 
  AND code NOT IN ('Q1-A101', 'Q1-A102', 'Q1-A103', 'Q1-C101', 'Q1-XS101', 'Q1-B201', 'Q1-XL101');

-- -----------------------------------------------------------------------------
-- BƯỚC 6: BẢNG KIỂM TRA ĐỐI SOÁT KẾT QUẢ SAU SEED (VERIFICATION TABLE)
-- -----------------------------------------------------------------------------
SELECT 
    c.id,
    c.code AS contract_code,
    su.code AS unit_code,
    su.status AS unit_status,
    c.status AS contract_status,
    c.end_date AS end_date,
    CASE 
        WHEN c.end_date < CURRENT_DATE THEN (CURRENT_DATE - c.end_date)
        ELSE 0 
    END AS days_overdue,
    c.deposit_amount AS deposit,
    c.overdue_fee_accrued AS overdue_fee,
    CASE WHEN c.access_code IS NOT NULL THEN ('MO (PIN: ' || c.access_code || ')') ELSE 'BI KHOA' END AS pin_state
FROM rental_contract c
JOIN storage_unit su ON c.storage_unit_id = su.id
WHERE c.code LIKE 'CTR-TEST-%'
ORDER BY c.id ASC;
