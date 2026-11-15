-- =============================================================================
-- SCRIPT SEED DỮ LIỆU KIỂM THỬ TOÀN DIỆN HỆ THỐNG (MASTER TEST SCENARIOS)
-- Đường dẫn: database/scripts/seed_test_scenarios.sql
-- Tác giả: Nguyễn Văn Gia Bình (WS2 Lead - SWP391)
--
-- Mục tiêu: Cung cấp 20 Kịch bản Thử nghiệm Vàng (Golden Test Scenarios)
--           bao phủ 100% các Flow nghiệp vụ trọng yếu:
--           - Flow 3: Trả sớm Win-Win, Quyết toán hoàn cọc & Quyết toán âm
--           - Flow 6.1: Vòng đời Gia hạn hợp đồng (T-60, T-30, T-25, T-21, T-20, T-7, T-3, Force Renewal & Hard Lock Xung đột)
--           - Flow 6.2: Vòng đời Quá hạn 8 ngày (No Pay No PIN, Đóng phạt nhận PIN tạm, Niêm phong Kho Tổng & Thanh lý quá 30 ngày)
--           - Flow 2: Khách chờ nhận kho (Check-in & Handover tại quầy)
--           - Sơ đồ kho: Đầy đủ các trạng thái OCCUPIED, CLEANING, RESERVED, MAINTENANCE, AVAILABLE.
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
-- BƯỚC 2: TẠO 12 ĐƠN ĐẶT CHỖ MẪU (RESERVATION TEST 9001..9012)
-- -----------------------------------------------------------------------------
INSERT INTO reservation (
    id, code, customer_id, facility_id, unit_type_id, storage_unit_id,
    start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
    policy_version_id, deposit_amount, total_rental_fee, total_payable,
    status, hold_expires_at, confirmed_at, fulfilled_at
)
VALUES
-- RES 9001: Cho HĐ CTR-TEST-001 (Kho Q1-A101, UT 1: UT-STD-S)
(9001, 'RES-TEST-001', 10, 5, 1, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A101'),
 CURRENT_DATE - INTERVAL '30 day', 3, CURRENT_DATE + INTERVAL '60 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9002: Cho HĐ CTR-TEST-002 (Kho Q1-A102, UT 1: UT-STD-S)
(9002, 'RES-TEST-002', 10, 5, 1, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A102'),
 CURRENT_DATE - INTERVAL '80 day', 3, CURRENT_DATE + INTERVAL '10 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9003: Cho HĐ CTR-TEST-003 (Kho Q1-A103, UT 2: UT-STD-M)
(9003, 'RES-TEST-003', 10, 5, 2, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A103'),
 CURRENT_DATE - INTERVAL '90 day', 3, CURRENT_DATE - INTERVAL '1 day', 1600000,
 1, 1600000, 4800000, 6400000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9004: Cho HĐ CTR-TEST-004 (Kho Q1-B201, UT 3: UT-STD-L)
(9004, 'RES-TEST-004', 10, 5, 3, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B201'),
 CURRENT_DATE - INTERVAL '180 day', 6, CURRENT_DATE - INTERVAL '2 day', 2000000,
 1, 2000000, 12000000, 14000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9005: Cho HĐ CTR-TEST-005 (Kho Q1-C101, UT 4: UT-AC-S)
(9005, 'RES-TEST-005', 10, 5, 4, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-C101'),
 CURRENT_DATE - INTERVAL '92 day', 3, CURRENT_DATE - INTERVAL '2 day', 1500000,
 1, 1500000, 4500000, 6000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9006: Cho HĐ CTR-TEST-006 (Kho Q1-XS101, UT 7: UT-STD-XS)
(9006, 'RES-TEST-006', 10, 5, 7, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XS101'),
 CURRENT_DATE - INTERVAL '95 day', 3, CURRENT_DATE - INTERVAL '5 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9007: Cho HĐ CTR-TEST-007 (Kho Q1-XL101, UT 8: UT-STD-XL)
(9007, 'RES-TEST-007', 10, 5, 8, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XL101'),
 CURRENT_DATE - INTERVAL '98 day', 3, CURRENT_DATE - INTERVAL '8 day', 2500000,
 1, 2500000, 7500000, 10000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9008: Cho HĐ CTR-TEST-008 (Kho Q1-XS201, UT 7: UT-STD-XS)
(9008, 'RES-TEST-008', 10, 5, 7, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XS201'),
 CURRENT_DATE - INTERVAL '135 day', 3, CURRENT_DATE - INTERVAL '45 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9009: Cho HĐ CTR-TEST-009 (Kho Q1-B101, UT 3: UT-STD-L) -> Quyết toán Âm
(9009, 'RES-TEST-009', 10, 5, 3, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B101'),
 CURRENT_DATE - INTERVAL '90 day', 3, CURRENT_DATE - INTERVAL '2 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9010: Cho HĐ CTR-TEST-010 (Kho Q1-A104, UT 1: UT-STD-S) -> Chờ Check-in Flow 2
(9010, 'RES-TEST-010', 10, 5, 1, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A104'),
 CURRENT_DATE, 1, CURRENT_DATE + INTERVAL '30 day', 1000000,
 1, 1000000, 1000000, 2000000, 'CONFIRMED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, NULL),

-- RES 9011: Cho HĐ CTR-TEST-011 (Kho Q1-A105, UT 2: UT-STD-M) -> Hủy trả kho khi CÒN HẠN (TC-F3-02A)
(9011, 'RES-TEST-011', 10, 5, 2, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A105'),
 CURRENT_DATE - INTERVAL '60 day', 3, CURRENT_DATE + INTERVAL '30 day', 1600000,
 1, 1600000, 4800000, 6400000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9012: Cho HĐ CTR-TEST-012 (Kho Q1-C102, UT 4: UT-AC-S) -> Quá hạn D+3 ĐÃ NỘP PHẠT nhận PIN tạm (TC-F6-01B)
(9012, 'RES-TEST-012', 10, 5, 4, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-C102'),
 CURRENT_DATE - INTERVAL '93 day', 3, CURRENT_DATE - INTERVAL '3 day', 1500000,
 1, 1500000, 4500000, 6000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9013: Cho HĐ CTR-TEST-013 (Kho Q1-A201, UT 1: UT-STD-S) -> Mốc T-30 ngày (Bắt đầu 10 ngày đếm ngược khẩn cấp ngày 1 - BR-REN-01, BR-REN-09)
(9013, 'RES-TEST-013', 10, 5, 1, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A201'),
 CURRENT_DATE - INTERVAL '60 day', 3, CURRENT_DATE + INTERVAL '30 day', 1000000,
 1, 1000000, 3000000, 4000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9014: Cho HĐ CTR-TEST-014 (Kho Q1-A202, UT 2: UT-STD-M) -> Mốc T-25 ngày (Đếm ngược khẩn cấp ngày 2 & Test N=1..12 tháng - BR-REN-01, BR-REN-03, BR-REN-07)
(9014, 'RES-TEST-014', 10, 5, 2, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A202'),
 CURRENT_DATE - INTERVAL '65 day', 3, CURRENT_DATE + INTERVAL '25 day', 1600000,
 1, 1600000, 4800000, 6400000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9015: Cho HĐ CTR-TEST-015 (Kho Q1-B202, UT 3: UT-STD-L) -> Mốc T-21 ngày (Đếm ngược khẩn cấp ngày 3, áp chót trước mốc 20 ngày - BR-REN-01)
(9015, 'RES-TEST-015', 10, 5, 3, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B202'),
 CURRENT_DATE - INTERVAL '69 day', 3, CURRENT_DATE + INTERVAL '21 day', 2000000,
 1, 2000000, 6000000, 8000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9016: Cho HĐ CTR-TEST-016 (Kho Q1-C201, UT 4: UT-AC-S) -> Mốc T-20 ngày (Biên tới hạn ngày cuối cùng được tự gia hạn Online trên Portal - BR-REN-01, BR-REN-09)
(9016, 'RES-TEST-016', 10, 5, 4, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-C201'),
 CURRENT_DATE - INTERVAL '70 day', 3, CURRENT_DATE + INTERVAL '20 day', 1500000,
 1, 1500000, 4500000, 6000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9017: Cho HĐ CTR-TEST-017 (Kho Q1-AC-M201, UT 5: UT-AC-M) -> Mốc T-7 ngày (Nhắc Move-out T-7 & FM Force Renewal thành công + 200k phí - BR-REN-10)
(9017, 'RES-TEST-017', 10, 5, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-AC-M201'),
 CURRENT_DATE - INTERVAL '83 day', 3, CURRENT_DATE + INTERVAL '7 day', 2400000,
 1, 2400000, 7200000, 9600000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9018: Cho HĐ CTR-TEST-018 (Kho Q1-AC-L201, UT 6: UT-AC-L) -> Mốc T-3 ngày (Test Xung đột: Ô này ĐÃ CÓ khách mới đặt cọc - BR-REN-10)
(9018, 'RES-TEST-018', 10, 5, 6, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-AC-L201'),
 CURRENT_DATE - INTERVAL '87 day', 3, CURRENT_DATE + INTERVAL '3 day', 3200000,
 1, 3200000, 9600000, 12800000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9019: Đơn đặt cọc của Khách mới (Tùng ID 11) tạo xung đột với HĐ CTR-TEST-018 (Kho Q1-AC-L201)
(9019, 'RES-TEST-018-CONFLICT', 11, 5, 6, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-AC-L201'),
 CURRENT_DATE + INTERVAL '3 day', 1, CURRENT_DATE + INTERVAL '33 day', 3200000,
 1, 3200000, 3200000, 6400000, 'CONFIRMED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, NULL),

-- RES 9020: Cho HĐ CTR-TEST-019 (Kho Q1-XL201, UT 8: UT-STD-XL) -> Quá 30 ngày lưu Kho Tổng đã thanh lý ngoại tuyến xong (BR-OVD-11 mục 2)
(9020, 'RES-TEST-019', 10, 5, 8, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XL201'),
 CURRENT_DATE - INTERVAL '135 day', 3, CURRENT_DATE - INTERVAL '45 day', 2500000,
 1, 2500000, 7500000, 10000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- RES 9021: Cho HĐ CTR-TEST-020 (Kho Q1-B301, UT 3: UT-STD-L) -> Trả sớm Win-Win trước hạn 60 ngày, Staff ĐÃ NGHIỆM THU nguyên vẹn, chờ FM duyệt quyết toán (BR-RET-06, UC-F3-07)
(9021, 'RES-TEST-020', 10, 5, 3, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B301'),
 CURRENT_DATE - INTERVAL '30 day', 3, CURRENT_DATE + INTERVAL '60 day', 2000000,
 1, 2000000, 6000000, 8000000, 'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- BƯỚC 3: TẠO 12 HỢP ĐỒNG THỬ NGHIỆM TRỌNG YẾU (RENTAL_CONTRACT 9001..9012)
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

-- Case 3: CTR-TEST-003 (PENDING_RETURN Chờ nghiệm thu) -> Test Hủy yêu cầu quá hạn (TC-F3-02B) & Staff nghiệm thu (UC-F3-06)
(9003, 'CTR-TEST-003', 9003, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A103'), 2,
 CURRENT_DATE - INTERVAL '90 day', CURRENT_DATE - INTERVAL '1 day', 3, 1600000, 4800000,
 1600000, 1600000, NULL, 'PENDING_RETURN', CURRENT_DATE - INTERVAL '90 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '90 day', NULL, NULL),

-- Case 4: CTR-TEST-004 (PENDING_RETURN Đã nghiệm thu hư hại nhẹ 500k) -> Test FM duyệt quyết toán cọc dương (UC-F3-07)
(9004, 'CTR-TEST-004', 9004, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B201'), 3,
 CURRENT_DATE - INTERVAL '180 day', CURRENT_DATE - INTERVAL '2 day', 6, 2000000, 12000000,
 2000000, 2000000, NULL, 'PENDING_RETURN', CURRENT_DATE - INTERVAL '180 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '180 day', NULL, NULL),

-- Case 5: CTR-TEST-005 (OVERDUE D+2 - Giai đoạn 1) -> Khóa PIN D+1 (BR-OVD-01), thu 5%/ngày (BR-OVD-02)
(9005, 'CTR-TEST-005', 9005, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-C101'), 4,
 CURRENT_DATE - INTERVAL '92 day', CURRENT_DATE - INTERVAL '2 day', 3, 1500000, 4500000,
 1500000, 1500000, NULL, 'OVERDUE', CURRENT_DATE - INTERVAL '92 day', 1,
 150000, CURRENT_TIMESTAMP - INTERVAL '92 day', NULL, NULL),

-- Case 6: CTR-TEST-006 (OVERDUE D+5 - Giai đoạn 2) -> Phạt 10%/ngày (BR-OVD-03), Chặn gia hạn, Chặn báo trả kho (TC-F3-01D)
(9006, 'CTR-TEST-006', 9006, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XS101'), 7,
 CURRENT_DATE - INTERVAL '95 day', CURRENT_DATE - INTERVAL '5 day', 3, 1000000, 3000000,
 1000000, 1000000, NULL, 'OVERDUE', CURRENT_DATE - INTERVAL '95 day', 1,
 350000, CURRENT_TIMESTAMP - INTERVAL '95 day', NULL, NULL),

-- Case 7: CTR-TEST-007 (TERMINATED D+8 - Giai đoạn 3) -> Tịch thu 100% cọc niêm phong về Kho Tổng (BR-OVD-07), Test FM quyết toán Kho Tổng (BR-OVD-11)
(9007, 'CTR-TEST-007', 9007, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XL101'), 8,
 CURRENT_DATE - INTERVAL '98 day', CURRENT_DATE - INTERVAL '8 day', 3, 2500000, 7500000,
 2500000, 0, NULL, 'TERMINATED', CURRENT_DATE - INTERVAL '98 day', 1,
 1375000, CURRENT_TIMESTAMP - INTERVAL '98 day', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL),

-- Case 8: CTR-TEST-008 (CLOSED Đã đóng tất toán) -> Test đối chứng lịch sử, không có nút trả kho (TC-F3-01E)
(9008, 'CTR-TEST-008', 9008, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XS201'), 7,
 CURRENT_DATE - INTERVAL '135 day', CURRENT_DATE - INTERVAL '45 day', 3, 1000000, 3000000,
 1000000, 0, NULL, 'CLOSED', CURRENT_DATE - INTERVAL '135 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '135 day', NULL, CURRENT_TIMESTAMP - INTERVAL '40 day'),

-- Case 9: CTR-TEST-009 (PENDING_RETURN - Quyết toán Âm: Thiệt hại 1.8M > Cọc 1.0M -> Nợ bù 800k SETTLEMENT - TC-F3-04C)
(9009, 'CTR-TEST-009', 9009, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B101'), 3,
 CURRENT_DATE - INTERVAL '90 day', CURRENT_DATE - INTERVAL '2 day', 3, 1000000, 3000000,
 1000000, 1000000, NULL, 'PENDING_RETURN', CURRENT_DATE - INTERVAL '90 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '90 day', NULL, NULL),

-- Case 10: CTR-TEST-010 (PENDING_CHECK_IN - Đã cọc & trả tiền, chờ Staff bàn giao kho Flow 2 - UC-F2-01..05)
(9010, 'CTR-TEST-010', 9010, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A104'), 1,
 CURRENT_DATE, CURRENT_DATE + INTERVAL '30 day', 1, 1000000, 1000000,
 1000000, 1000000, NULL, 'PENDING_CHECK_IN', NULL, 1,
 0, NULL, NULL, NULL),

-- Case 11: CTR-TEST-011 (PENDING_RETURN - Hạn còn 30 ngày, test Hủy báo trả khôi phục ACTIVE - TC-F3-02A)
(9011, 'CTR-TEST-011', 9011, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A105'), 2,
 CURRENT_DATE - INTERVAL '60 day', CURRENT_DATE + INTERVAL '30 day', 3, 1600000, 4800000,
 1600000, 1600000, '654321', 'PENDING_RETURN', CURRENT_DATE - INTERVAL '60 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '60 day', NULL, NULL),

-- Case 12: CTR-TEST-012 (OVERDUE D+3 - Đã nộp phạt quá hạn, cấp PIN tạm 23:59 & mở nút Báo trả kho - TC-F6-01B)
(9012, 'CTR-TEST-012', 9012, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-C102'), 4,
 CURRENT_DATE - INTERVAL '93 day', CURRENT_DATE - INTERVAL '3 day', 3, 1500000, 4500000,
 1500000, 1500000, '888999', 'OVERDUE', CURRENT_DATE - INTERVAL '93 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '93 day', NULL, NULL),

-- Case 13: CTR-TEST-013 (ACTIVE Mốc T-30 ngày) -> Test Chuỗi đếm ngược khẩn cấp ngày 1 & Nút gia hạn online sáng (BR-REN-01, BR-REN-09)
(9013, 'CTR-TEST-013', 9013, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A201'), 1,
 CURRENT_DATE - INTERVAL '60 day', CURRENT_DATE + INTERVAL '30 day', 3, 1000000, 3000000,
 1000000, 1000000, '111222', 'ACTIVE', CURRENT_DATE - INTERVAL '60 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '60 day', NULL, NULL),

-- Case 14: CTR-TEST-014 (ACTIVE Mốc T-25 ngày) -> Test Chuỗi đếm ngược khẩn cấp ngày 2 & Test chọn số tháng 1..12 (BR-REN-01, BR-REN-03, BR-REN-07)
(9014, 'CTR-TEST-014', 9014, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A202'), 2,
 CURRENT_DATE - INTERVAL '65 day', CURRENT_DATE + INTERVAL '25 day', 3, 1600000, 4800000,
 1600000, 1600000, '222333', 'ACTIVE', CURRENT_DATE - INTERVAL '65 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '65 day', NULL, NULL),

-- Case 15: CTR-TEST-015 (ACTIVE Mốc T-21 ngày) -> Test Chuỗi đếm ngược khẩn cấp ngày 3 (Áp chót trước khi khóa cổng - BR-REN-01)
(9015, 'CTR-TEST-015', 9015, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B202'), 3,
 CURRENT_DATE - INTERVAL '69 day', CURRENT_DATE + INTERVAL '21 day', 3, 2000000, 6000000,
 2000000, 2000000, '333444', 'ACTIVE', CURRENT_DATE - INTERVAL '69 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '69 day', NULL, NULL),

-- Case 16: CTR-TEST-016 (ACTIVE Mốc T-20 ngày) -> Test Biên tới hạn ngày cuối cùng được tự gia hạn Online trên Portal (BR-REN-01, BR-REN-09)
(9016, 'CTR-TEST-016', 9016, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-C201'), 4,
 CURRENT_DATE - INTERVAL '70 day', CURRENT_DATE + INTERVAL '20 day', 3, 1500000, 4500000,
 1500000, 1500000, '444555', 'ACTIVE', CURRENT_DATE - INTERVAL '70 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '70 day', NULL, NULL),

-- Case 17: CTR-TEST-017 (ACTIVE Mốc T-7 ngày) -> Test Nhắc Move-out T-7 & FM duyệt Force Renewal thành công + 200k phí (BR-REN-01, BR-REN-10)
(9017, 'CTR-TEST-017', 9017, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-AC-M201'), 5,
 CURRENT_DATE - INTERVAL '83 day', CURRENT_DATE + INTERVAL '7 day', 3, 2400000, 7200000,
 2400000, 2400000, '555666', 'ACTIVE', CURRENT_DATE - INTERVAL '83 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '83 day', NULL, NULL),

-- Case 18: CTR-TEST-018 (ACTIVE Mốc T-3 ngày) -> Test Xung đột: Ô đã có khách cọc -> FM duyệt Force Renewal bị chặn 409 (BR-REN-10)
(9018, 'CTR-TEST-018', 9018, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-AC-L201'), 6,
 CURRENT_DATE - INTERVAL '87 day', CURRENT_DATE + INTERVAL '3 day', 3, 3200000, 9600000,
 3200000, 3200000, '666777', 'ACTIVE', CURRENT_DATE - INTERVAL '87 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '87 day', NULL, NULL),

-- Case 19: CTR-TEST-019 (CLOSED - Quá hạn D+45, quá 30 ngày lưu Kho Tổng đã thanh lý ngoại tuyến xong - BR-OVD-11 mục 2)
(9019, 'CTR-TEST-019', 9020, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-XL201'), 8,
 CURRENT_DATE - INTERVAL '135 day', CURRENT_DATE - INTERVAL '45 day', 3, 2500000, 7500000,
 2500000, 0, NULL, 'CLOSED', CURRENT_DATE - INTERVAL '135 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '135 day', CURRENT_TIMESTAMP - INTERVAL '38 day', CURRENT_TIMESTAMP - INTERVAL '8 day'),

-- Case 20: CTR-TEST-020 (PENDING_RETURN - Trả sớm Win-Win trước hạn 60 ngày, ĐÃ NGHIỆM THU nguyên vẹn, chờ FM duyệt - BR-RET-06, UC-F3-07)
(9020, 'CTR-TEST-020', 9021, 10, 5, (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-B301'), 3,
 CURRENT_DATE - INTERVAL '30 day', CURRENT_DATE + INTERVAL '60 day', 3, 2000000, 6000000,
 2000000, 2000000, NULL, 'PENDING_RETURN', CURRENT_DATE - INTERVAL '30 day', 1,
 0, CURRENT_TIMESTAMP - INTERVAL '30 day', NULL, NULL)
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

-- 4.2 Case 4 (CTR-TEST-004): Tạo biên bản đã nghiệm thu có hư hỏng nhẹ BOM (500k)
-- Theo ContractServiceImpl.java#L1258, damage_cost trên return_request lưu 0L khi có phụ phí BOM để tránh cộng trùng
INSERT INTO return_request (
    contract_id, requested_at, requested_return_date, appointment_slot,
    status, inspected_by, inspected_at, is_intact, damage_cost, condition_note, customer_confirmed
)
VALUES (
    9004, CURRENT_TIMESTAMP - INTERVAL '2 day', CURRENT_DATE - INTERVAL '1 day', '14:00 - 16:00',
    'PENDING', 9, CURRENT_TIMESTAMP - INTERVAL '3 hour', FALSE, 0,
    'Hư hại nhẹ ổ khóa và xước thanh ray cửa cuốn', TRUE
);

-- Phụ phí BOM hư hại nhẹ 500k (Mã tiền tố 'DAMAGE:' để khớp logic isCatalogInspectionCharge)
INSERT INTO contract_extra_charge (
    contract_id, extra_fee_type_id, amount, reason, recorded_by, status
)
VALUES (
    9004, 3, 500000, 'DAMAGE: Phí sửa chữa ổ khóa cửa cuốn (Mã BOM: DAMAGE_MINOR)', 9, 'UNPAID'
);

-- 4.3 Case 9 (CTR-TEST-009): Biên bản nghiệm thu & phụ phí thiệt hại nặng 1.8M (Quyết toán Âm)
INSERT INTO return_request (
    contract_id, requested_at, requested_return_date, appointment_slot,
    status, inspected_by, inspected_at, is_intact, damage_cost, condition_note, customer_confirmed
)
VALUES (
    9009, CURRENT_TIMESTAMP - INTERVAL '2 day', CURRENT_DATE - INTERVAL '1 day', '10:00 - 11:30',
    'PENDING', 9, CURRENT_TIMESTAMP - INTERVAL '2 hour', FALSE, 0,
    'Hư hại nặng: Gãy bung ray cuốn cửa kho và sàn kho bị dính dầu mỡ nặng', TRUE
);

-- Phụ phí BOM vượt cọc (1.5M + 300k = 1.8M > Cọc 1.0M -> Nợ bù 800k)
INSERT INTO contract_extra_charge (contract_id, extra_fee_type_id, amount, reason, recorded_by, status)
VALUES 
(9009, 3, 1500000, 'DAMAGE: Phí thay mới cụm ray cuốn cửa kho (Mã BOM: DAMAGE_MAJOR)', 9, 'UNPAID'),
(9009, 2, 300000,  'CLEANING: Phí vệ sinh chuyên sâu tẩy rửa sàn kho (Mã BOM: CLEANING_FEE)', 9, 'UNPAID');

-- 4.4 Case 11 (CTR-TEST-011): Yêu cầu trả kho còn hạn dài để test khách bấm HỦY (TC-F3-02A)
INSERT INTO return_request (
    contract_id, requested_at, requested_return_date, appointment_slot,
    status, inspected_by, inspected_at, is_intact, damage_cost
)
VALUES (
    9011, CURRENT_TIMESTAMP - INTERVAL '4 hour', CURRENT_DATE + INTERVAL '5 day', '08:00 - 10:00',
    'PENDING', NULL, NULL, NULL, 0
);

-- 4.5 Case 19 (CTR-TEST-019): Biên bản thanh lý ngoại tuyến sau 30 ngày lưu Kho Tổng (BR-OVD-11 mục 2)
INSERT INTO return_request (
    contract_id, requested_at, requested_return_date, appointment_slot,
    status, inspected_by, inspected_at, is_intact, damage_cost, deposit_refund_amount, condition_note, customer_confirmed
)
VALUES (
    9019, CURRENT_TIMESTAMP - INTERVAL '38 day', CURRENT_DATE - INTERVAL '38 day', '10:00 - 11:00',
    'COMPLETED', 8, CURRENT_TIMESTAMP - INTERVAL '8 day', FALSE, 0, 0,
    'Tài sản quá hạn lưu Kho Tổng quá 30 ngày không có người nhận. Cơ sở đã thanh lý ngoại tuyến bù đắp chi phí theo Biên bản số TL-Q1-2026/019 (BR-OVD-11 mục 2).', TRUE
);

-- 4.6 Case 20 (CTR-TEST-020): Yêu cầu trả sớm Win-Win ĐÃ NGHIỆM THU nguyên vẹn, chờ FM duyệt quyết toán (BR-RET-06, UC-F3-07)
INSERT INTO return_request (
    contract_id, requested_at, requested_return_date, appointment_slot,
    status, inspected_by, inspected_at, is_intact, damage_cost, deposit_refund_amount, condition_note, customer_confirmed
)
VALUES (
    9020, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_DATE, '09:00 - 11:00',
    'PENDING', 9, CURRENT_TIMESTAMP - INTERVAL '2 hour', TRUE, 0, 0,
    'Nghiệm thu hiện trường đạt chuẩn: Ô kho sạch sẽ, nguyên trạng, không hư hỏng thiết bị. Khách trả kho sớm trước hạn 60 ngày.', TRUE
);

-- Cập nhật ngày trả kho thực tế cho HĐ 9020 để kích hoạt công thức Trả sớm Win-Win (BR-RET-06)
UPDATE rental_contract SET return_date = CURRENT_DATE WHERE id = 9020;

-- 4.7 Biên bản bàn giao nhận kho chuẩn (Handover Record) cho các hợp đồng đã check-in thành công
-- Lưu ý: CTR-TEST-010 KHÔNG tạo handover_record vì đang ở trạng thái PENDING_CHECK_IN chờ Staff thực hiện
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
(9008, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Hợp đồng đã hoàn tất chu kỳ thuê.', CURRENT_TIMESTAMP - INTERVAL '135 day', CURRENT_TIMESTAMP - INTERVAL '135 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '135 day', FALSE),
(9009, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao lúc nhận kho ban đầu.', CURRENT_TIMESTAMP - INTERVAL '90 day', CURRENT_TIMESTAMP - INTERVAL '90 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '90 day', FALSE),
(9011, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '60 day', CURRENT_TIMESTAMP - INTERVAL '60 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '60 day', FALSE),
(9012, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '93 day', CURRENT_TIMESTAMP - INTERVAL '93 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '93 day', FALSE),
(9013, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '60 day', CURRENT_TIMESTAMP - INTERVAL '60 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '60 day', FALSE),
(9014, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '65 day', CURRENT_TIMESTAMP - INTERVAL '65 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '65 day', FALSE),
(9015, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '69 day', CURRENT_TIMESTAMP - INTERVAL '69 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '69 day', FALSE),
(9016, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '70 day', CURRENT_TIMESTAMP - INTERVAL '70 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '70 day', FALSE),
(9017, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '83 day', CURRENT_TIMESTAMP - INTERVAL '83 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '83 day', FALSE),
(9018, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '87 day', CURRENT_TIMESTAMP - INTERVAL '87 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '87 day', FALSE),
(9019, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao lúc nhận kho ban đầu. Hợp đồng sau đó phát sinh quá hạn D+7 cưỡng chế.', CURRENT_TIMESTAMP - INTERVAL '135 day', CURRENT_TIMESTAMP - INTERVAL '135 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '135 day', FALSE),
(9020, 9, 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao lúc nhận kho ban đầu. Đã kích hoạt mã PIN.', CURRENT_TIMESTAMP - INTERVAL '30 day', CURRENT_TIMESTAMP - INTERVAL '30 day', 'COMPLETED', TRUE, CURRENT_TIMESTAMP - INTERVAL '30 day', FALSE)
ON CONFLICT (contract_id) DO UPDATE SET
    rejected = EXCLUDED.rejected,
    condition_note = EXCLUDED.condition_note,
    status = EXCLUDED.status,
    customer_confirmed = EXCLUDED.customer_confirmed;

-- -----------------------------------------------------------------------------
-- BƯỚC 5: ĐỒNG BỘ TRẠNG THÁI Ô KHO VẬT LÝ (STORAGE_UNIT)
-- -----------------------------------------------------------------------------
-- 5.1 Các ô kho đang cho thuê hoặc khách vẫn đang giữ đồ
UPDATE storage_unit 
SET status = 'OCCUPIED'   
WHERE facility_id = 5 
  AND code IN (
    'Q1-A101', 'Q1-A102', 'Q1-A103', 'Q1-C101', 'Q1-XS101', 'Q1-A105', 'Q1-C102',
    'Q1-A201', 'Q1-A202', 'Q1-B202', 'Q1-C201', 'Q1-AC-M201', 'Q1-AC-L201', 'Q1-B301'
  );

-- 5.2 Các ô kho đã hoàn tất nghiệm thu trả kho, đang ở đệm vệ sinh dọn dẹp (CLEANING)
UPDATE storage_unit 
SET status = 'CLEANING'
WHERE facility_id = 5 
  AND code IN ('Q1-B201', 'Q1-B101');

-- 5.3 Ô kho đã được khách giữ chỗ & thanh toán cọc thành công, khóa chờ Check-in (RESERVED)
UPDATE storage_unit 
SET status = 'RESERVED'
WHERE facility_id = 5 
  AND code = 'Q1-A104';

-- 5.4 Ô kho thuộc hợp đồng quá hạn D+7 cưỡng chế niêm phong về Kho Tổng (MAINTENANCE)
UPDATE storage_unit 
SET status = 'MAINTENANCE'
WHERE facility_id = 5 
  AND code = 'Q1-XL101';

-- 5.5 Ô kho của hợp đồng CLOSED đã thanh lý xong
UPDATE storage_unit 
SET status = 'AVAILABLE'  
WHERE facility_id = 5 
  AND code IN ('Q1-XS201', 'Q1-XL201');

-- 5.6 Tất cả các ô kho vật lý còn lại của Cơ sở 5 (phục vụ trải nghiệm thuê mới Flow 1 trên portal)
UPDATE storage_unit 
SET status = 'AVAILABLE' 
WHERE facility_id = 5 
  AND code NOT IN (
    'Q1-A101', 'Q1-A102', 'Q1-A103', 'Q1-C101', 'Q1-XS101', 'Q1-A105', 'Q1-C102',
    'Q1-A201', 'Q1-A202', 'Q1-B202', 'Q1-C201', 'Q1-AC-M201', 'Q1-AC-L201', 'Q1-B301',
    'Q1-B201', 'Q1-B101', 'Q1-A104', 'Q1-XL101', 'Q1-XS201'
  );

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
