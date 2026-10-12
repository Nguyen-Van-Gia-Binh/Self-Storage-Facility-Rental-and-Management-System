/* ============================================================================
   Flyway Migration V51__adjust_customer_demo_contracts_for_testing.sql
   Điều chỉnh ma trận hợp đồng thực tế cho tài khoản demo Nguyễn Phạm Xuân Nhi:
   1. Tạo hợp đồng CẦN GIA HẠN (Sắp hết hạn):
      - CTR-20260928-2077 (Q1-A104): Còn 5 ngày (kết thúc DATEADD(day, 5, CAST(GETDATE() AS DATE))) -> Khẩn cấp <= 7 ngày
      - CTR-20260625-8802 (Q1-A102): Còn 18 ngày (kết thúc DATEADD(day, 18, CAST(GETDATE() AS DATE))) -> Cảnh báo <= 30 ngày
   2. Tạo hợp đồng QUÁ HẠN (OVERDUE):
      - CTR-DEMO-HBT-A103 (HBT-A103): Quá hạn D+2 (kết thúc DATEADD(day, -2, CAST(GETDATE() AS DATE))), nợ phạt = 0 (Ân hạn BR-OVD-02)
      - CTR-DEMO-HC-B202 (HC-B202): Quá hạn D+5 (kết thúc DATEADD(day, -5, CAST(GETDATE() AS DATE))), nợ phạt = 150.000 đ (BR-OVD-03)
      - CTR-20260622-9901 (BT-A101): Quá hạn D+8 (kết thúc DATEADD(day, -8, CAST(GETDATE() AS DATE))), nợ phạt = 350.000 đ, khóa PIN (BR-OVD-05)
   3. Giảm bớt số lượng ô kho đang hoạt động dài hạn (chuyển sang CLOSED):
      - CTR-DEMO-CG-S104: Chuyển sang CLOSED
      - CTR-DEMO-CG-C404: Chuyển sang CLOSED
   ============================================================================ */

-- 1. Hợp đồng cần gia hạn (Sắp hết hạn)
UPDATE rental_contract
SET end_date = CONVERT(VARCHAR(10), DATEADD(day, 5, GETDATE()), 120),
    status = 'ACTIVE',
    overdue_fee_accrued = 0
WHERE code = 'CTR-20260928-2077';

UPDATE rental_contract
SET end_date = CONVERT(VARCHAR(10), DATEADD(day, 18, GETDATE()), 120),
    status = 'ACTIVE',
    overdue_fee_accrued = 0
WHERE code = 'CTR-20260625-8802';

-- 2. Hợp đồng quá hạn (OVERDUE)
-- 2.1. Quá hạn Ân hạn D+2: nợ phạt 0
UPDATE rental_contract
SET end_date = CONVERT(VARCHAR(10), DATEADD(day, -2, GETDATE()), 120),
    status = 'OVERDUE',
    overdue_fee_accrued = 0
WHERE code = 'CTR-DEMO-HBT-A103';

-- 2.2. Quá hạn D+5: nợ phạt 150.000 đ
UPDATE rental_contract
SET end_date = CONVERT(VARCHAR(10), DATEADD(day, -5, GETDATE()), 120),
    status = 'OVERDUE',
    overdue_fee_accrued = 150000
WHERE code = 'CTR-DEMO-HC-B202';

-- 2.3. Quá hạn D+8: nợ phạt 350.000 đ (khóa mã PIN an ninh)
UPDATE rental_contract
SET end_date = CONVERT(VARCHAR(10), DATEADD(day, -8, GETDATE()), 120),
    status = 'OVERDUE',
    overdue_fee_accrued = 350000
WHERE code = 'CTR-20260622-9901';

-- Khóa mã PIN an ninh cho hợp đồng D+8 theo BR-OVD-05
UPDATE ac
SET ac.status = 'SUSPENDED'
FROM access_credential ac
JOIN rental_contract rc ON ac.contract_id = rc.id
WHERE rc.code = 'CTR-20260622-9901';

-- 3. Giảm bớt số lượng ô kho đang hoạt động dài hạn (chuyển sang CLOSED)
UPDATE rental_contract
SET status = 'CLOSED'
WHERE code IN ('CTR-DEMO-CG-S104', 'CTR-DEMO-CG-C404');

-- Cập nhật trạng thái ô kho tương ứng về AVAILABLE để sạch dữ liệu
UPDATE su
SET su.status = 'AVAILABLE'
FROM storage_unit su
JOIN rental_contract rc ON rc.storage_unit_id = su.id
WHERE rc.code IN ('CTR-DEMO-CG-S104', 'CTR-DEMO-CG-C404');
