-- =============================================================================
-- SCRIPT KIỂM THỬ TOÀN DIỆN: MA TRẬN QUÁ HẠN HỢP ĐỒNG 4 GIAI ĐOẠN (BR-OVD-01..08)
-- Đường dẫn: database/scripts/test_overdue_contracts_matrix.sql
-- Mục tiêu: Kiểm thử chuyên sâu 4 phân tầng quá hạn hợp đồng trên tài khoản demo:
--           Nguyễn Phạm Xuân Nhi (nhi.customer@gmail.com).
--
-- HƯỚNG DẪN CHẠY NHANH CHO CẢ NHÓM (QUICK RUN GUIDE):
-- -----------------------------------------------------------------------------
-- [Cách 1] Chạy trên Docker (PowerShell):
--   Get-Content database/scripts/test_overdue_contracts_matrix.sql -Raw | docker exec -i sqlserver-selfstorage /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourPassword123" -d SelfStorageDB -C
--
-- [Cách 2] Chạy trên SQL Server cài cục bộ (Localhost Windows sqlcmd):
--   sqlcmd -S localhost -U sa -P "YourPassword123" -d SelfStorageDB -i database/scripts/test_overdue_contracts_matrix.sql
--   (Nếu dùng Windows Auth: sqlcmd -S localhost -E -d SelfStorageDB -i database/scripts/test_overdue_contracts_matrix.sql)
--
-- [Cách 3] Chạy qua công cụ GUI (SSMS / Azure Data Studio / DBeaver / DataGrip):
--   Mở file này, chọn Database 'SelfStorageDB', nhấn nút Execute (phím F5).
-- -----------------------------------------------------------------------------
--
-- Ma trận 4 Giai đoạn Quá hạn (Overdue 4-Bucket Lifecycle):
--   - Bucket 1 (D+2): Ân hạn (1-3 ngày) -> 0% Phạt, PIN mở, mở nút "Báo trả kho" (BR-OVD-02)
--   - Bucket 2 (D+5): Tính phí phạt (4-6 ngày) -> Phạt 20% cọc, PIN mở, mở nút "Nộp phạt" (BR-OVD-03)
--   - Bucket 3 (D+8): Khóa mã PIN (7-9 ngày) -> Phạt 50% cọc, PIN bị khóa (BR-OVD-05)
--   - Bucket 4 (D+11): Chấm dứt & Niêm phong (10+ ngày) -> Chốt 70% cọc, TERMINATED, ô kho CLEANING (BR-OVD-07)
--   - Hợp đồng 5 (D-30): Giữ nguyên ACTIVE (30 ngày) làm đối chứng trực quan
-- =============================================================================

USE SelfStorageDB;
GO

-- =============================================================================
-- PHẦN 0: KIỂM TRA CHÍNH SÁCH QUÁ HẠN & DỮ LIỆU HIỆN TẠI (PRE-CHECK)
-- =============================================================================
PRINT N'=============================================================================';
PRINT N'>>> [BƯỚC 0] Kiểm tra ngày hệ thống, Policy quá hạn và 5 hợp đồng mục tiêu:';
PRINT N'=============================================================================';

DECLARE @Today DATE = CAST(GETDATE() AS DATE);
SELECT @Today AS [System_Date_Today];

-- Đọc cấu hình chính sách quá hạn đang có hiệu lực trong hệ thống
SELECT TOP 1
    pv.version_no,
    pv.effective_from,
    pv.overdue_grace_days        AS [Grace_Days (D+1..D+3)],
    pv.overdue_daily_rate        AS [Daily_Rate_10%],
    pv.overdue_cap_rate          AS [Cap_Rate_70%],
    pv.overdue_lock_access_days  AS [Lock_Access_Days (D+7)],
    pv.overdue_termination_days  AS [Termination_Days (D+10)]
FROM policy_version pv
WHERE pv.effective_from <= @Today
ORDER BY pv.effective_from DESC, pv.id DESC;

-- Kiểm tra 5 hợp đồng mục tiêu trước khi chạy giả lập
SELECT 
    c.id,
    c.code AS contract_code,
    su.code AS unit_code,
    su.status AS unit_status,
    c.status AS contract_status,
    c.end_date,
    DATEDIFF(DAY, c.end_date, @Today) AS days_overdue_if_past,
    c.overdue_fee_accrued,
    c.deposit_amount,
    CASE WHEN c.access_code IS NOT NULL THEN N'ĐANG MỞ' ELSE N'BỊ KHÓA' END AS access_pin_state
FROM rental_contract c
JOIN storage_unit su ON c.storage_unit_id = su.id
WHERE c.code IN ('CTR-20260929-5788', 'CTR-DEMO-HC-B202', 'CTR-DEMO-HBT-A103', 'CTR-DEMO-CG-S104', 'CTR-DEMO-CG-C404')
ORDER BY c.id ASC;
GO

-- =============================================================================
-- PHẦN 1: THIẾT LẬP DỮ LIỆU GIẢ LẬP 4 GIAI ĐOẠN QUÁ HẠN (SIMULATION SETUP)
-- =============================================================================
PRINT N'=============================================================================';
PRINT N'>>> [BƯỚC 1] Giả lập dữ liệu 4 giai đoạn quá hạn (D+2, D+5, D+8, D+11) + 1 Active:';
PRINT N'=============================================================================';

DECLARE @Today DATE = CAST(GETDATE() AS DATE);

-- 1. Cập nhật Hợp đồng
WITH TargetContracts AS (
    SELECT 
        c.id,
        c.storage_unit_id,
        c.deposit_amount,
        ROW_NUMBER() OVER (ORDER BY c.id ASC) AS rn
    FROM rental_contract c
    WHERE c.code IN ('CTR-20260929-5788', 'CTR-DEMO-HC-B202', 'CTR-DEMO-HBT-A103', 'CTR-DEMO-CG-S104', 'CTR-DEMO-CG-C404')
)
UPDATE c
SET 
    -- 1. Ngày kết thúc hợp đồng (end_date)
    c.end_date = CASE tc.rn
                    WHEN 1 THEN DATEADD(DAY, -2,  @Today) -- Bucket 1: D+2 (Ân hạn)
                    WHEN 2 THEN DATEADD(DAY, -5,  @Today) -- Bucket 2: D+5 (Phạt 2 ngày = 20%)
                    WHEN 3 THEN DATEADD(DAY, -8,  @Today) -- Bucket 3: D+8 (Khóa PIN, phạt 50%)
                    WHEN 4 THEN DATEADD(DAY, -11, @Today) -- Bucket 4: D+11 (Chấm dứt, chốt phạt 70%)
                    WHEN 5 THEN DATEADD(DAY, 30,  @Today) -- HĐ 5: Đối chứng ACTIVE 30 ngày
                 END,

    -- 2. Trạng thái hợp đồng
    c.status = CASE tc.rn
                    WHEN 1 THEN 'OVERDUE'
                    WHEN 2 THEN 'OVERDUE'
                    WHEN 3 THEN 'OVERDUE'
                    WHEN 4 THEN 'TERMINATED'
                    WHEN 5 THEN 'ACTIVE'
               END,

    -- 3. Phí quá hạn tích lũy (overdue_fee_accrued)
    c.overdue_fee_accrued = CASE tc.rn
                    WHEN 1 THEN 0                                               -- D+2: 0 đ (Ân hạn)
                    WHEN 2 THEN ROUND(tc.deposit_amount * 0.20, 0)              -- D+5: 20% tiền cọc
                    WHEN 3 THEN ROUND(tc.deposit_amount * 0.50, 0)              -- D+8: 50% tiền cọc
                    WHEN 4 THEN ROUND(tc.deposit_amount * 0.70, 0)              -- D+11: Chốt trần 70% cọc
                    WHEN 5 THEN 0                                               -- HĐ 5: 0 đ
                 END,

    -- 4. Tiền cọc còn lại (deposit_balance sau cấn trừ phạt)
    c.deposit_balance = CASE tc.rn
                    WHEN 4 THEN ROUND(tc.deposit_amount * 0.30, 0)              -- D+11: Cấn trừ còn 30%
                    ELSE tc.deposit_amount
                 END,

    -- 5. Mã PIN truy cập (access_code)
    c.access_code = CASE tc.rn
                    WHEN 3 THEN NULL                                            -- D+8: Bị khóa theo BR-OVD-05
                    WHEN 4 THEN NULL                                            -- D+11: Vô hiệu hóa vĩnh viễn
                    ELSE '123456'                                               -- Các mốc khác mở bình thường
                 END,

    c.updated_at = SYSDATETIMEOFFSET()
FROM rental_contract c
JOIN TargetContracts tc ON c.id = tc.id;

-- 2. Đồng bộ trạng thái Ô kho vật lý (Storage Unit) tại mốc D+11 sang CLEANING
WITH TargetContracts AS (
    SELECT 
        c.id,
        c.storage_unit_id,
        ROW_NUMBER() OVER (ORDER BY c.id ASC) AS rn
    FROM rental_contract c
    WHERE c.code IN ('CTR-20260929-5788', 'CTR-DEMO-HC-B202', 'CTR-DEMO-HBT-A103', 'CTR-DEMO-CG-S104', 'CTR-DEMO-CG-C404')
)
UPDATE su
SET su.status = CASE tc.rn
                    WHEN 4 THEN 'CLEANING'  -- D+11: Ô kho chuyển sang dọn dẹp niêm phong
                    ELSE 'OCCUPIED'         -- Các kho còn lại vẫn đang lưu đồ
                END,
    su.updated_at = SYSDATETIMEOFFSET()
FROM storage_unit su
JOIN TargetContracts tc ON su.id = tc.storage_unit_id;

PRINT N'>>> Đã thiết lập xong dữ liệu giả lập 4 mốc quá hạn + 1 mốc đối chứng.';
GO

-- =============================================================================
-- PHẦN 2: BẢNG MA TRẬN KIỂM CHỨNG NGHIỆP VỤ (AUDIT & VERIFICATION MATRIX)
-- =============================================================================
PRINT N'=============================================================================';
PRINT N'>>> [BƯỚC 2] Bảng đối chiếu kết quả kiểm thử ma trận quá hạn 4 giai đoạn:';
PRINT N'=============================================================================';

DECLARE @Today DATE = CAST(GETDATE() AS DATE);

WITH TargetContracts AS (
    SELECT 
        c.id,
        ROW_NUMBER() OVER (ORDER BY c.id ASC) AS rn
    FROM rental_contract c
    WHERE c.code IN ('CTR-20260929-5788', 'CTR-DEMO-HC-B202', 'CTR-DEMO-HBT-A103', 'CTR-DEMO-CG-S104', 'CTR-DEMO-CG-C404')
)
SELECT 
    c.code AS [Contract_Code],
    su.code AS [Unit_Code],
    su.status AS [Unit_Status],
    c.status AS [Contract_Status],
    c.end_date AS [End_Date],
    
    -- Số ngày quá hạn (D+n) hoặc số ngày còn hạn
    CASE 
        WHEN c.end_date < @Today THEN 'D+' + CAST(DATEDIFF(DAY, c.end_date, @Today) AS VARCHAR(10))
        ELSE 'Con ' + CAST(DATEDIFF(DAY, @Today, c.end_date) AS VARCHAR(10)) + N' ngay'
    END AS [Timeline_Milestone],

    c.deposit_amount AS [Deposit_Amount],
    c.overdue_fee_accrued AS [Overdue_Fee_Accrued],

    -- Tỷ lệ phạt tương đối
    CASE 
        WHEN c.deposit_amount > 0 THEN 
            CAST(ROUND((CAST(c.overdue_fee_accrued AS FLOAT) / c.deposit_amount) * 100, 0) AS VARCHAR(10)) + '%'
        ELSE '0%'
    END AS [Penalty_Rate],

    -- Tình trạng mã PIN
    CASE 
        WHEN c.access_code IS NOT NULL THEN N'MỞ (123456)'
        ELSE N'BỊ KHÓA (NULL)'
    END AS [Access_PIN],

    -- Hành vi kỳ vọng trên giao diện Web
    CASE tc.rn
        WHEN 1 THEN N'Badge: Ân hạn D+2 | Hiện nút "Báo trả kho" | Ẩn nút Nộp phạt | Ẩn nút Gia hạn'
        WHEN 2 THEN N'Badge: Quá hạn D+5 | Khóa nút "Báo trả kho" | Hiện nút "Nộp phạt 20%" | Nộp xong mở lại Gia hạn'
        WHEN 3 THEN N'Badge: Quá hạn D+8 (Khóa cửa) | Mã PIN bị ẩn | Hiện nút "Nộp phạt 50%"'
        WHEN 4 THEN N'Chấm dứt (TERMINATED) | Ô kho CLEANING | Chốt phạt 70% | Nhân viên niêm phong kho'
        WHEN 5 THEN N'Badge: Sắp hết hạn (30 ngày) | Nút Gia hạn MỞ | Hợp đồng ACTIVE bình thường'
    END AS [Expected_UI_Behavior],

    -- Đánh giá Pass/Fail
    CASE 
        WHEN tc.rn = 1 AND c.status = 'OVERDUE' AND c.overdue_fee_accrued = 0 AND c.access_code IS NOT NULL THEN N'PASS (B1: Ân hạn)'
        WHEN tc.rn = 2 AND c.status = 'OVERDUE' AND c.overdue_fee_accrued > 0 AND c.access_code IS NOT NULL THEN N'PASS (B2: Phạt nợ)'
        WHEN tc.rn = 3 AND c.status = 'OVERDUE' AND c.overdue_fee_accrued > 0 AND c.access_code IS NULL     THEN N'PASS (B3: Khóa PIN)'
        WHEN tc.rn = 4 AND c.status = 'TERMINATED' AND su.status = 'CLEANING' AND c.access_code IS NULL    THEN N'PASS (B4: Chấm dứt)'
        WHEN tc.rn = 5 AND c.status = 'ACTIVE'                                                             THEN N'PASS (Đối chứng)'
        ELSE N'CHECK LẠI'
    END AS [Test_Result]

FROM rental_contract c
JOIN TargetContracts tc ON c.id = tc.id
JOIN storage_unit su ON c.storage_unit_id = su.id
ORDER BY c.end_date ASC;
GO

-- =============================================================================
-- PHẦN 3: SCRIPT KHÔI PHỤC NGUYÊN TRẠNG DỮ LIỆU (TEARDOWN / RESET SCRIPT)
-- =============================================================================
-- Khi kiểm thử xong hoặc muốn đưa dữ liệu về ban đầu, bỏ comment khối lệnh sau:
/*
PRINT N'=============================================================================';
PRINT N'>>> [BƯỚC 3] Khôi phục toàn bộ 5 hợp đồng và ô kho về trạng thái ban đầu:';
PRINT N'=============================================================================';

DECLARE @Today DATE = CAST(GETDATE() AS DATE);

UPDATE c
SET c.status = 'ACTIVE',
    c.end_date = '2027-12-29',
    c.overdue_fee_accrued = 0,
    c.deposit_balance = c.deposit_amount,
    c.access_code = '123456',
    c.updated_at = SYSDATETIMEOFFSET()
FROM rental_contract c
WHERE c.code IN ('CTR-20260929-5788', 'CTR-DEMO-HC-B202', 'CTR-DEMO-HBT-A103', 'CTR-DEMO-CG-S104', 'CTR-DEMO-CG-C404');

UPDATE su
SET su.status = 'OCCUPIED',
    su.updated_at = SYSDATETIMEOFFSET()
FROM storage_unit su
JOIN rental_contract c ON su.id = c.storage_unit_id
WHERE c.code IN ('CTR-20260929-5788', 'CTR-DEMO-HC-B202', 'CTR-DEMO-HBT-A103', 'CTR-DEMO-CG-S104', 'CTR-DEMO-CG-C404');

PRINT N'>>> Đã khôi phục thành công toàn bộ dữ liệu hợp đồng và ô kho về trạng thái ban đầu.';
*/
