-- ==============================================================================
-- Migration V36: Link toàn bộ hợp đồng test & dữ liệu mẫu cho tài khoản Lead Nhi
-- Tài khoản: Nguyễn Phạm Xuân Nhi (xuannhi.nguyenpham@gmail.com)
-- ==============================================================================

-- 1. Đảm bảo tài khoản Lead Nhi tồn tại trong app_user (INSERT nếu chưa có, UPDATE nếu đã có)
INSERT INTO app_user (id, email, password_hash, full_name, phone, identity_number, role, status)
VALUES (
    12,
    'xuannhi.nguyenpham@gmail.com',
    '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi',
    'Nguyễn Phạm Xuân Nhi',
    '0973499377',
    '051306007726',
    'STORAGE_CUSTOMER',
    'ACTIVE'
)
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    identity_number = EXCLUDED.identity_number,
    password_hash = EXCLUDED.password_hash,
    status = 'ACTIVE';

-- Cập nhật sequence của app_user để tránh xung đột id khi đăng ký mới
SELECT setval(pg_get_serial_sequence('app_user', 'id'), GREATEST((SELECT MAX(id) FROM app_user), 12));

-- 2. Gán toàn bộ hợp đồng test mẫu (CTR-TEST-001 đến CTR-TEST-026) cho tài khoản Lead Nhi
UPDATE rental_contract
SET customer_id = (SELECT id FROM app_user WHERE email = 'xuannhi.nguyenpham@gmail.com' LIMIT 1),
    customer_name = 'Nguyễn Phạm Xuân Nhi',
    customer_phone = '0973499377',
    customer_email = 'xuannhi.nguyenpham@gmail.com',
    customer_identity_number = '051306007726'
WHERE customer_id = 10 OR code LIKE 'CTR-TEST-%';

-- 3. Gán đơn đặt chỗ (Reservation) tương ứng sang tài khoản Lead Nhi
UPDATE reservation
SET customer_id = (SELECT id FROM app_user WHERE email = 'xuannhi.nguyenpham@gmail.com' LIMIT 1),
    customer_name = 'Nguyễn Phạm Xuân Nhi',
    customer_phone = '0973499377',
    customer_email = 'xuannhi.nguyenpham@gmail.com',
    customer_identity_number = '051306007726'
WHERE customer_id = 10 OR code LIKE 'RES-TEST-%';

-- 4. Đồng bộ yêu cầu hỗ trợ (SupportRequest) sang tài khoản Lead Nhi
UPDATE support_request
SET customer_id = (SELECT id FROM app_user WHERE email = 'xuannhi.nguyenpham@gmail.com' LIMIT 1)
WHERE customer_id = 10;

-- 5. Tạo dữ liệu mẫu Phụ lục gia hạn (ContractRenewal) cho hợp đồng CTR-TEST-003 (giữ CTR-TEST-002 sạch để test trực tiếp)
INSERT INTO contract_renewal (
    contract_id, previous_end_date, new_end_date, rental_months,
    monthly_price_snapshot, policy_version_id, overdue_fee_settled,
    rental_fee_amount, total_paid, created_at
)
SELECT 
    rc.id, '2026-11-26', '2027-02-26', 3,
    rc.monthly_price_snapshot, rc.policy_version_id, 0,
    rc.monthly_price_snapshot * 3, rc.monthly_price_snapshot * 3,
    CURRENT_TIMESTAMP - INTERVAL '15 day'
FROM rental_contract rc
WHERE rc.code = 'CTR-TEST-003'
  AND NOT EXISTS (SELECT 1 FROM contract_renewal cr WHERE cr.contract_id = rc.id);

-- 6. Tạo dữ liệu mẫu Phụ lục điều chuyển ô kho cho CTR-TEST-014
INSERT INTO support_request (
    code, customer_id, contract_id, storage_unit_id, category,
    description, status, assigned_staff_id, relocation_required,
    customer_notice, created_at, resolved_at
)
SELECT 
    'SUP-202611-0088', (SELECT id FROM app_user WHERE email = 'xuannhi.nguyenpham@gmail.com' LIMIT 1), rc.id, rc.storage_unit_id, 'UNIT_DAMAGE',
    'Sự cố kỹ thuật thấm dột tại ô kho ban đầu. Đã điều phối cấp ô kho mới tương đương.',
    'RESOLVED', 9, TRUE,
    'Ô kho ban đầu gặp sự cố thấm dột. Ban Quản lý đã cấp ô kho mới và cập nhật mã PIN.',
    CURRENT_TIMESTAMP - INTERVAL '5 day', CURRENT_TIMESTAMP - INTERVAL '4 day'
FROM rental_contract rc
WHERE rc.code = 'CTR-TEST-014'
  AND NOT EXISTS (SELECT 1 FROM support_request sr WHERE sr.code = 'SUP-202611-0088');
