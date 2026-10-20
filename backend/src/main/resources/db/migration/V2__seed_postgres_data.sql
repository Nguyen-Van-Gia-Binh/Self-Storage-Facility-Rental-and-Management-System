/* ============================================================================
   Self-Storage Facility Rental and Management System
   Flyway Migration: V2__seed_postgres_data.sql
   Database: PostgreSQL 16+
   Dữ liệu mẫu khởi tạo hoàn chỉnh cho toàn bộ hệ thống (Consolidated Baseline Seed)
   ============================================================================ */

-- ============================================================================
-- 1. TÀI KHOẢN NGƯỜI DÙNG (APP_USER)
-- Mật khẩu mặc định: password123
-- BCrypt hash: $2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi
-- ============================================================================
INSERT INTO app_user (id, email, password_hash, full_name, phone, identity_number, role, status)
VALUES
(1,  'customer@storage.vn',    '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Nguyễn Văn Khách',       '0901234567', '001202000001', 'STORAGE_CUSTOMER',           'ACTIVE'),
(2,  'staff@storage.vn',       '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Trần Thị Nhân Viên',     '0912345678', NULL,           'FACILITY_STAFF',              'ACTIVE'),
(3,  'manager@storage.vn',     '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Lê Quản Lý Cơ Sở',       '0923456789', NULL,           'FACILITY_MANAGER',            'ACTIVE'),
(4,  'bom@storage.vn',         '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Phạm Giám Đốc BOM',      '0934567890', NULL,           'BUSINESS_OPERATIONS_MANAGER', 'ACTIVE'),
(5,  'admin@storage.vn',       '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Hoàng Quản Trị Hệ Thống', '0945678901', NULL,         'SYSTEM_ADMINISTRATOR',        'ACTIVE'),
(6,  'admin@smartstorage.vn',  '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Lê Thanh Tùng',          '0901234568', '079099001234', 'SYSTEM_ADMINISTRATOR',        'ACTIVE'),
(7,  'bom@smartstorage.vn',    '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Huỳnh Nhật',             '0912345679', '079099002345', 'BUSINESS_OPERATIONS_MANAGER', 'ACTIVE'),
(8,  'fm.q1@smartstorage.vn',  '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Nguyễn Văn Gia Bình',     '0923456780', '079099003456', 'FACILITY_MANAGER',            'ACTIVE'),
(9,  'staff.q1@smartstorage.vn','$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi','Trần Văn Hùng',          '0934567891', '079099004567', 'FACILITY_STAFF',              'ACTIVE'),
(10, 'nhi.customer@gmail.com', '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Nguyễn Phạm Xuân Nhi',    '0967890123', '079099007890', 'STORAGE_CUSTOMER',           'ACTIVE'),
(11, 'tung@gmail.com',         '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', 'Tùng Khách Hàng',        '0988776655', '001202000002', 'STORAGE_CUSTOMER',           'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. CƠ SỞ LƯU TRỮ (FACILITY) - 8 Cơ sở toàn quốc
-- ============================================================================
INSERT INTO facility (id, code, name, address, phone, description, opening_hours, status)
VALUES
(1, 'FAC-CG',  'Cơ sở Cầu Giấy - Hà Nội',      'Số 19 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',                      '024-3795-8888', 'Cơ sở trung tâm công nghệ Cầu Giấy, tiếp cận thuận tiện từ đường Duy Tân và Phạm Hùng. Hệ thống giám sát an ninh camera AI 24/7, kiểm soát ra vào mã PIN tự động và hệ thống PCCC tiêu chuẩn.', '06:00–22:00', 'ACTIVE'),
(2, 'FAC-Q7',  'Cơ sở Quận 7 - TP.HCM',        'Số 10 Mai Văn Vĩnh, Tân Quy, Quận 7, TP.HCM',                         '028-3775-9999', 'Cơ sở hiện đại tại Nam Sài Gòn, tích hợp hệ thống ô kho kiểm soát độ ẩm, điều hòa nhiệt độ tiêu chuẩn (Climate-Controlled), bãi đỗ xe tải bốc dỡ hàng hóa rộng rãi và bảo vệ trực 24/7.', '00:00–24:00 (24/7)', 'ACTIVE'),
(3, 'FAC-HBT', 'Cơ sở Hai Bà Trưng - Hà Nội',  'Số 125 Phố Huế, Phường Ngô Thì Nhậm, Quận Hai Bà Trưng, Hà Nội',       '024-3976-1122', 'Cơ sở nằm tại trung tâm thương mại sầm uất phía Nam thủ đô. Rất thuận tiện lưu trữ tài liệu chứng từ kế toán, hồ sơ công ty và đồ dùng cá nhân chất lượng cao.', '07:00–21:00', 'ACTIVE'),
(4, 'FAC-TX',  'Cơ sở Thanh Xuân - Hà Nội',    'Số 36 Hoàng Cầu, Đống Đa, Hà Nội (Khu vực giáp ranh Thanh Xuân)',      '024-3853-4455', 'Cơ sở đa năng phục vụ cư dân và hộ kinh doanh online trục đường vành đai và tàu điện trên cao Cát Linh - Hà Đông. Thang hàng tải trọng lớn, camera giám sát từng góc hành lang.', '06:00–22:00', 'ACTIVE'),
(5, 'FAC-Q1',  'Cơ sở Quận 1 - TP.HCM',        'Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',                       '028-3822-6677', 'Vị trí đắc địa tại lõi trung tâm tài chính TP.HCM. Phù hợp lưu trữ tài liệu cao cấp, hành lý khách du lịch, đồ giá trị cao với tiêu chuẩn an ninh 5 lớp tối tân.', '07:00–22:00', 'ACTIVE'),
(6, 'FAC-TD',  'Cơ sở TP. Thủ Đức - TP.HCM',   'Số 88 Song Hành, Phường An Phú, TP. Thủ Đức, TP.HCM',                  '028-7300-3344', 'Cơ sở kho bãi thông minh cửa ngõ phía Đông Sài Gòn. Diện tích mặt sàn lớn, xe container ra vào 24/7, dock bốc dỡ hàng thủy lực tự động.', '06:00–23:00', 'ACTIVE'),
(7, 'FAC-BT',  'Cơ sở Bình Thạnh - TP.HCM',    'Số 152 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',            '028-3512-8899', 'Cơ sở cửa ngõ kết nối trung tâm thành phố và bán đảo Thanh Đa. Giao thông thuận lợi, trang bị xe nâng hạ hàng miễn phí và phòng điều hòa bảo quản chuyên sâu.', '06:30–22:00', 'ACTIVE'),
(8, 'FAC-HA',  'Cơ sở Hà Đông - Hà Nội',       'Số 10 Trần Phú, Phường Mộ Lao, Quận Hà Đông, Hà Nội',                  '024-3354-9900', 'Cơ sở kho tự quản quy mô lớn khu vực Tây Nam Hà Nội. Mặt tiền rộng rãi, thang máy công nghiệp cỡ lớn, khu vực đỗ xe miễn phí cho khách hàng chuyển đồ.', '06:00–22:00', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Gán phân quyền cơ sở cho nhân viên & quản lý
INSERT INTO user_facility_assignment (user_id, facility_id)
SELECT u.id, f.id FROM app_user u, facility f
WHERE (u.email IN ('manager@storage.vn', 'fm.q1@smartstorage.vn', 'staff@storage.vn', 'staff.q1@smartstorage.vn'))
ON CONFLICT (user_id, facility_id) DO NOTHING;

-- ============================================================================
-- 3. LOẠI Ô KHO (UNIT TYPE)
-- ============================================================================
INSERT INTO unit_type (id, code, name, width_m, length_m, height_m, description, is_active)
VALUES
(1, 'UT-SMALL',   'Kho Nhỏ (Small Locker)',   1.00, 1.00, 1.50, 'Phù hợp lưu trữ tài liệu, vali, đồ đạc cá nhân nhỏ gọn.', TRUE),
(2, 'UT-MEDIUM',  'Kho Vừa (Medium Unit)',    2.00, 2.00, 2.50, 'Phù hợp đồ dùng phòng trọ, đồ điện gia dụng, xe đạp.', TRUE),
(3, 'UT-LARGE',   'Kho Lớn (Large Unit)',     3.00, 3.00, 3.00, 'Phù hợp chuyển nhà trọn gói, nội thất gia đình, hàng kinh doanh.', TRUE),
(4, 'UT-CLIMATE', 'Kho Lạnh (Climate Unit)',  2.00, 2.50, 2.50, 'Kho điều hòa nhiệt độ ổn định, phù hợp đồ da, rượu vang, thiết bị điện tử.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. BẢNG GIÁ THEO CƠ SỞ (FACILITY_UNIT_TYPE_PRICE)
-- ============================================================================
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price, price_per_m2)
VALUES
-- FAC-CG
(1, 1, 500000, 500000),  (1, 2, 1200000, 300000), (1, 3, 2500000, 277777), (1, 4, 3000000, 600000),
-- FAC-Q7
(2, 1, 550000, 550000),  (2, 2, 1300000, 325000), (2, 3, 2600000, 288888), (2, 4, 3200000, 640000),
-- FAC-HBT
(3, 1, 600000, 600000),  (3, 2, 1400000, 350000), (3, 3, 2800000, 311111), (3, 4, 3500000, 700000),
-- FAC-TX
(4, 1, 500000, 500000),  (4, 2, 1200000, 300000), (4, 3, 2500000, 277777), (4, 4, 3000000, 600000),
-- FAC-Q1
(5, 1, 700000, 700000),  (5, 2, 1600000, 400000), (5, 3, 3200000, 355555), (5, 4, 4000000, 800000),
-- FAC-TD
(6, 1, 500000, 500000),  (6, 2, 1150000, 287500), (6, 3, 2400000, 266666), (6, 4, 2900000, 580000),
-- FAC-BT
(7, 1, 550000, 550000),  (7, 2, 1250000, 312500), (7, 3, 2550000, 283333), (7, 4, 3100000, 620000),
-- FAC-HA
(8, 1, 450000, 450000),  (8, 2, 1100000, 275000), (8, 3, 2300000, 255555), (8, 4, 2800000, 560000)
ON CONFLICT (facility_id, unit_type_id) DO NOTHING;

-- Bảng giá phiên bản
INSERT INTO facility_unit_type_price_version (facility_id, unit_type_id, monthly_price, price_per_m2, effective_from, effective_to, created_by)
SELECT facility_id, unit_type_id, monthly_price, price_per_m2, '2026-01-01 00:00:00+07', NULL, 4
FROM facility_unit_type_price
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. PHIÊN BẢN CHÍNH SÁCH (POLICY_VERSION)
-- ============================================================================
INSERT INTO policy_version (
    id, version_no, effective_from, deposit_multiplier, reservation_hold_hours,
    checkin_grace_days, cancel_full_refund_hours, cancel_late_refund_rate, cancel_no_show_refund_rate,
    renewal_reminder_days, renewal_min_months, renewal_max_months, overdue_grace_days,
    overdue_daily_rate, overdue_cap_rate, overdue_lock_access_days, overdue_notice_days,
    overdue_termination_days, return_notice_days, return_refund_working_days, return_early_refund_rate,
    access_pin_length, support_urgent_sla_hours, support_auto_close_working_days,
    rental_buffer_days, rental_daily_divisor, published_by
)
VALUES (
    1, 1, '2026-01-01 00:00:00+07', 1.00, 48,
    10, 48, 0.50, 0.00,
    '60,7,3,1', 1, 12, 3,
    0.10, 0.70, 10, 4,
    10, 30, 7, 0.00,
    6, 2, 7,
    15, 30, 4
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. DANH MỤC PHỤ PHÍ & PHIÊN BẢN (EXTRA_FEE_TYPE & EXTRA_FEE_VERSION)
-- ============================================================================
INSERT INTO extra_fee_type (id, code, name, amount, category, is_active)
VALUES
(1, 'ACCESS_CARD_REISSUE', 'Phí cấp lại thẻ truy cập / remote', 150000, 'ADMINISTRATIVE', TRUE),
(2, 'CLEANING_FEE',        'Phí vệ sinh ô kho',                 200000, 'CLEANING',       TRUE),
(3, 'DAMAGE_MINOR',         'Phí hư hại nhẹ vách ngăn / ổ khóa', 500000, 'MAINTENANCE',    TRUE),
(4, 'OVERDUE_LOCK',         'Phí khóa kho / niêm phong quá hạn', 300000, 'PENALTY',        TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO extra_fee_version (extra_fee_type_id, code, name, fee_type, category, amount, is_active, effective_from, created_by)
SELECT id, code, name, 'FIXED', category, amount, TRUE, '2026-01-01', 4
FROM extra_fee_type
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. CHƯƠNG TRÌNH KHUYẾN MẠI (DISCOUNT_PROGRAM)
-- ============================================================================
INSERT INTO discount_program (id, name, discount_type, discount_value, min_rental_months, start_date, end_date, scope_type, is_active)
VALUES
(1, 'Ưu đãi thuê từ 6 tháng (5%)',           'PERCENT', 5.00,  6,  '2026-01-01', '2026-12-31', 'SYSTEM', TRUE),
(2, 'Ưu đãi thuê dài hạn từ 12 tháng (10%)',  'PERCENT', 10.00, 12, '2026-01-01', '2026-12-31', 'SYSTEM', TRUE),
(3, 'Giảm giá mùa hè Cơ sở Cầu Giấy',        'AMOUNT',  200000.00, 1, '2026-05-01', '2026-08-31', 'FACILITY', TRUE),
(4, 'Ưu đãi khai trương Kho Lạnh',           'PERCENT', 15.00, 3,  '2026-01-01', '2026-12-31', 'UNIT_TYPE', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. DANH SÁCH Ô KHO (STORAGE_UNIT) - Mẫu cho các cơ sở
-- ============================================================================
INSERT INTO storage_unit (facility_id, unit_type_id, code, floor, position, location_note, status)
VALUES
-- FAC-CG (Cầu Giấy)
(1, 1, 'CG-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Cạnh cửa chính', 'AVAILABLE'),
(1, 1, 'CG-S102', 1, 'Khu A', 'Tầng 1 - Khu A - Cạnh thang bộ',   'AVAILABLE'),
(1, 1, 'CG-S103', 1, 'Khu A', 'Tầng 1 - Khu A - Lối đi giữa',     'AVAILABLE'),
(1, 1, 'CG-S104', 1, 'Khu A', 'Tầng 1 - Khu A - Cạnh cửa kho',    'OCCUPIED'),
(1, 2, 'CG-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Gần thang máy',   'AVAILABLE'),
(1, 2, 'CG-M202', 2, 'Khu B', 'Tầng 2 - Khu B - Cửa rộng',        'AVAILABLE'),
(1, 2, 'CG-M203', 2, 'Khu B', 'Tầng 2 - Khu B - Hành lang sau',   'AVAILABLE'),
(1, 2, 'CG-M204', 2, 'Khu B', 'Tầng 2 - Khu B - Lô góc',          'AVAILABLE'),
(1, 3, 'CG-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Xe đẩy vào được', 'AVAILABLE'),
(1, 3, 'CG-L102', 1, 'Khu C', 'Tầng 1 - Khu C - Cạnh dock hàng',  'AVAILABLE'),
(1, 4, 'CG-C101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho lạnh chuẩn',  'AVAILABLE'),
(1, 4, 'CG-C102', 1, 'Khu D', 'Tầng 1 - Khu D - Đang bảo trì',    'MAINTENANCE'),

-- FAC-Q7 (Quận 7)
(2, 1, 'Q7-S101', 1, 'Khu A', 'Tầng 1 - Khu A - Lối đi chính',    'AVAILABLE'),
(2, 1, 'Q7-S102', 1, 'Khu A', 'Tầng 1 - Khu A - Lô góc',          'AVAILABLE'),
(2, 2, 'Q7-M201', 2, 'Khu B', 'Tầng 2 - Khu B - Cạnh thang hàng', 'AVAILABLE'),
(2, 2, 'Q7-M202', 2, 'Khu B', 'Tầng 2 - Khu B - Cửa cuốn',        'AVAILABLE'),
(2, 3, 'Q7-L101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho hàng lớn',    'AVAILABLE'),
(2, 4, 'Q7-C101', 1, 'Khu D', 'Tầng 1 - Khu D - Kho rượu vang',   'AVAILABLE'),

-- FAC-Q1 (Quận 1)
(5, 1, 'Q1-A101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho vali',        'AVAILABLE'),
(5, 1, 'Q1-A102', 1, 'Khu A', 'Tầng 1 - Khu A - Tủ hồ sơ',        'AVAILABLE'),
(5, 2, 'Q1-A103', 1, 'Khu A', 'Tầng 1 - Khu A - Kho tài liệu',    'OCCUPIED'),
(5, 3, 'Q1-B201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho nội thất',    'AVAILABLE'),
(5, 4, 'Q1-C101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho lạnh thời trang','AVAILABLE'),

-- FAC-TX (Thanh Xuân)
(4, 1, 'TX-A101', 1, 'Khu A', 'Tầng 1 - Khu A - Kho nhỏ',         'AVAILABLE'),
(4, 2, 'TX-A102', 1, 'Khu A', 'Tầng 1 - Khu A - Kho vừa',         'AVAILABLE'),
(4, 3, 'TX-B201', 2, 'Khu B', 'Tầng 2 - Khu B - Kho lớn',         'AVAILABLE'),
(4, 4, 'TX-C101', 1, 'Khu C', 'Tầng 1 - Khu C - Kho lạnh',        'AVAILABLE')
ON CONFLICT (facility_id, code) DO NOTHING;

-- ============================================================================
-- 9. ĐƠN ĐẶT CHỖ & HỢP ĐỒNG THUÊ MẪU (RESERVATION & RENTAL_CONTRACT)
-- ============================================================================
-- Đơn đặt chỗ mẫu 1 (Khách Nhi - Q1)
INSERT INTO reservation (
    id, code, customer_id, facility_id, unit_type_id, storage_unit_id,
    start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
    policy_version_id, deposit_amount, total_rental_fee, total_payable,
    status, hold_expires_at, confirmed_at, fulfilled_at
)
VALUES (
    1, 'RES-NHI-001', 10, 5, 2,
    (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A103'),
    '2026-08-01', 3, '2026-11-01', 1600000,
    1, 1600000, 4800000, 6400000,
    'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', '2026-07-28 10:00:00+07', '2026-08-01 08:30:00+07'
)
ON CONFLICT (id) DO NOTHING;

-- Hợp đồng mẫu 1 (Active)
INSERT INTO rental_contract (
    id, code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
    start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee,
    deposit_amount, deposit_balance, access_code, status, checkin_date, policy_version_id,
    overdue_fee_accrued
)
VALUES (
    1, 'CTR-NHI-001', 1, 10, 5,
    (SELECT id FROM storage_unit WHERE facility_id = 5 AND code = 'Q1-A103'),
    2, '2026-08-01', '2026-11-01', 3, 1600000, 4800000,
    1600000, 1600000, '889922', 'ACTIVE', '2026-08-01', 1, 0
)
ON CONFLICT (id) DO NOTHING;

-- Biên bản bàn giao hợp đồng 1
INSERT INTO handover_record (
    contract_id, staff_id, condition_note, customer_signed_at, staff_signed_at,
    status, customer_confirmed, customer_confirmed_at
)
VALUES (
    1, 9, 'Ô kho sạch sẽ, cửa cuốn hoạt động tốt, mã PIN đã bàn giao.',
    '2026-08-01 09:00:00+07', '2026-08-01 09:05:00+07', 'COMPLETED', TRUE, '2026-08-01 09:00:00+07'
)
ON CONFLICT (contract_id) DO NOTHING;

-- Giao dịch thanh toán hợp đồng 1
INSERT INTO payment_transaction (
    reservation_id, contract_id, transaction_type, amount, status, payment_method, provider_reference
)
VALUES (
    1, 1, 'INITIAL_PAYMENT', 6400000, 'SUCCESS', 'VNPAY', 'VNPAY-20260728-001'
)
ON CONFLICT DO NOTHING;

-- Đơn đặt chỗ mẫu 2 (Khách Customer1 - Cầu Giấy)
INSERT INTO reservation (
    id, code, customer_id, facility_id, unit_type_id, storage_unit_id,
    start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
    policy_version_id, deposit_amount, total_rental_fee, total_payable,
    status, hold_expires_at, confirmed_at, fulfilled_at
)
VALUES (
    2, 'RES-CG-002', 1, 1, 1,
    (SELECT id FROM storage_unit WHERE facility_id = 1 AND code = 'CG-S104'),
    '2026-09-01', 6, '2027-03-01', 500000,
    1, 500000, 3000000, 3500000,
    'FULFILLED', CURRENT_TIMESTAMP + INTERVAL '48 hour', '2026-08-25 14:00:00+07', '2026-09-01 09:00:00+07'
)
ON CONFLICT (id) DO NOTHING;

-- Hợp đồng mẫu 2 (Active)
INSERT INTO rental_contract (
    id, code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
    start_date, end_date, rental_months, monthly_price_snapshot, total_rental_fee,
    deposit_amount, deposit_balance, access_code, status, checkin_date, policy_version_id,
    overdue_fee_accrued
)
VALUES (
    2, 'CTR-CG-002', 2, 1, 1,
    (SELECT id FROM storage_unit WHERE facility_id = 1 AND code = 'CG-S104'),
    1, '2026-09-01', '2027-03-01', 6, 500000, 3000000,
    500000, 500000, '123456', 'ACTIVE', '2026-09-01', 1, 0
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. YÊU CẦU HỖ TRỢ & PHÂN CÔNG (SUPPORT_REQUEST & STAFF_DAILY_ASSIGNMENT)
-- ============================================================================
INSERT INTO support_request (
    id, code, customer_id, contract_id, category, description, status, assigned_staff_id, sla_due_at
)
VALUES (
    1, 'SUP-2026-001', 10, 1, 'LOCK_ACCESS', 'Quên mã PIN ô kho, cần hỗ trợ cấp lại mã mới.',
    'RESOLVED', 9, CURRENT_TIMESTAMP + INTERVAL '4 hour'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_daily_assignment (
    staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by
)
VALUES
(9, 1, CURRENT_DATE, 'HANDOVER', 'HANDOVER_RECORD', 1, 8),
(9, 1, CURRENT_DATE, 'SUPPORT',  'SUPPORT_REQUEST', 1, 8)
ON CONFLICT DO NOTHING;

-- Lịch sử đăng nhập mẫu
INSERT INTO login_history (user_id, logged_in_at, ip_address, user_agent, is_success)
VALUES
(6, CURRENT_TIMESTAMP - INTERVAL '1 hour', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', TRUE),
(7, CURRENT_TIMESTAMP - INTERVAL '2 hour', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', TRUE),
(8, CURRENT_TIMESTAMP - INTERVAL '3 hour', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', TRUE),
(9, CURRENT_TIMESTAMP - INTERVAL '4 hour', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', TRUE),
(10, CURRENT_TIMESTAMP - INTERVAL '5 hour', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. ĐỒNG BỘ LẠI IDENTITY SEQUENCE (PREVENT DUPLICATE KEY ON FUTURE INSERTS)
-- ============================================================================
SELECT setval(pg_get_serial_sequence('app_user', 'id'), COALESCE((SELECT MAX(id) FROM app_user), 1));
SELECT setval(pg_get_serial_sequence('facility', 'id'), COALESCE((SELECT MAX(id) FROM facility), 1));
SELECT setval(pg_get_serial_sequence('unit_type', 'id'), COALESCE((SELECT MAX(id) FROM unit_type), 1));
SELECT setval(pg_get_serial_sequence('facility_unit_type_price', 'id'), COALESCE((SELECT MAX(id) FROM facility_unit_type_price), 1));
SELECT setval(pg_get_serial_sequence('facility_unit_type_price_version', 'id'), COALESCE((SELECT MAX(id) FROM facility_unit_type_price_version), 1));
SELECT setval(pg_get_serial_sequence('storage_unit', 'id'), COALESCE((SELECT MAX(id) FROM storage_unit), 1));
SELECT setval(pg_get_serial_sequence('policy_version', 'id'), COALESCE((SELECT MAX(id) FROM policy_version), 1));
SELECT setval(pg_get_serial_sequence('extra_fee_type', 'id'), COALESCE((SELECT MAX(id) FROM extra_fee_type), 1));
SELECT setval(pg_get_serial_sequence('extra_fee_version', 'id'), COALESCE((SELECT MAX(id) FROM extra_fee_version), 1));
SELECT setval(pg_get_serial_sequence('discount_program', 'id'), COALESCE((SELECT MAX(id) FROM discount_program), 1));
SELECT setval(pg_get_serial_sequence('reservation', 'id'), COALESCE((SELECT MAX(id) FROM reservation), 1));
SELECT setval(pg_get_serial_sequence('rental_contract', 'id'), COALESCE((SELECT MAX(id) FROM rental_contract), 1));
SELECT setval(pg_get_serial_sequence('handover_record', 'id'), COALESCE((SELECT MAX(id) FROM handover_record), 1));
SELECT setval(pg_get_serial_sequence('payment_transaction', 'id'), COALESCE((SELECT MAX(id) FROM payment_transaction), 1));
SELECT setval(pg_get_serial_sequence('support_request', 'id'), COALESCE((SELECT MAX(id) FROM support_request), 1));
SELECT setval(pg_get_serial_sequence('staff_daily_assignment', 'id'), COALESCE((SELECT MAX(id) FROM staff_daily_assignment), 1));
SELECT setval(pg_get_serial_sequence('login_history', 'id'), COALESCE((SELECT MAX(id) FROM login_history), 1));
