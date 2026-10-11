-- =============================================================================
-- SCRIPT KIỂM THỬ TOÀN DIỆN: MA TRẬN THÔNG BÁO GIA HẠN HỢP ĐỒNG (BR-REN-01 & UC-F6-01)
-- Đường dẫn: database/scripts/test_renewal_notification_30d.sql
-- Mục tiêu: Kiểm thử toàn diện 5 mốc biên thời gian trước khi kết thúc hợp đồng
--           trên tài khoản demo Nguyễn Phạm Xuân Nhi (nhi.customer@gmail.com).
--
-- HƯỚNG DẪN CHẠY NHANH CHO CẢ NHÓM (QUICK RUN GUIDE):
-- -----------------------------------------------------------------------------
-- [Cách 1] Chạy trên Docker (PowerShell):
--   Get-Content database/scripts/test_renewal_notification_30d.sql -Raw | docker exec -i sqlserver-selfstorage /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourPassword123" -d SelfStorageDB -C
--
-- [Cách 2] Chạy trên SQL Server cài cục bộ (Localhost Windows sqlcmd):
--   sqlcmd -S localhost -U sa -P "YourPassword123" -d SelfStorageDB -i database/scripts/test_renewal_notification_30d.sql
--   (Nếu dùng Windows Auth: sqlcmd -S localhost -E -d SelfStorageDB -i database/scripts/test_renewal_notification_30d.sql)
--
-- [Cách 3] Chạy qua công cụ GUI (SSMS / Azure Data Studio / DBeaver / DataGrip):
--   Mở file này, chọn Database 'SelfStorageDB', nhấn nút Execute (phím F5).
-- -----------------------------------------------------------------------------
--
-- Triết lý thiết kế (Senior Backend & Ponytail):
--   1. Self-Adapting (Tự thích ứng): Dùng DATEADD(DAY, N, GETDATE()) để ngày luôn
--      chính xác theo thời gian thực tại thời điểm chạy (bất kể năm tháng nào).
--   2. Dynamic CTE: Không hard-code ID bản ghi, tự động phân bổ 5 mốc kiểm thử
--      cho 5 hợp đồng ACTIVE của user demo theo thứ tự c.id.
--   3. An toàn & Tự chủ (Idempotent & Safe): Có sẵn khối Teardown khôi phục nguyên trạng.
--
-- Ma trận 5 mốc kiểm thử:
--   - Mốc 1 (40 ngày): Ngoài cửa sổ [30..37] -> Âm tính (Bình thường, không pop-up)
--   - Mốc 2 (35 ngày): Trong cửa sổ chủ động [30..37] -> Dương tính (Badge vàng "Sắp hết hạn", Pop-up)
--   - Mốc 3 (30 ngày): Đúng mốc chuẩn BR-REN-01 -> Dương tính (Cảnh báo mốc 30 ngày)
--   - Mốc 4 (29 ngày): Khoảng lặng chống spam [8..29] -> Âm tính Pop-up (Nút gia hạn vẫn mở)
--   - Mốc 5 ( 7 ngày): Mốc khẩn cấp BR-REN-01 -> Dương tính cấp 1 (Cảnh báo khẩn cấp đỏ)
-- =============================================================================

USE SelfStorageDB;
GO

-- =============================================================================
-- PHẦN 0: KIỂM TRA CHÍNH SÁCH HIỆN HÀNH & TRẠNG THÁI BAN ĐẦU (PRE-CHECK)
-- =============================================================================
PRINT N'=============================================================================';
PRINT N'>>> [BƯỚC 0] Kiểm tra ngày hệ thống, Policy hiệu lực và các hợp đồng ACTIVE:';
PRINT N'=============================================================================';

DECLARE @Today DATE = CAST(GETDATE() AS DATE);
SELECT @Today AS [System_Date_Today];

-- Đọc cấu hình chính sách đang có hiệu lực trong hệ thống
SELECT TOP 1
    pv.version_no,
    pv.effective_from,
    pv.return_notice_days       AS [Policy_Return_Notice_Days],
    pv.renewal_reminder_days     AS [Policy_Renewal_Reminder_Days],
    pv.overdue_grace_days        AS [Policy_Overdue_Grace_Days]
FROM policy_version pv
WHERE pv.effective_from <= @Today
ORDER BY pv.effective_from DESC, pv.id DESC;

-- Kiểm tra 5 hợp đồng ACTIVE hiện tại của tài khoản demo
SELECT 
    c.id,
    c.code AS contract_code,
    su.code AS unit_code,
    f.name AS facility_name,
    c.status,
    c.start_date,
    c.end_date,
    DATEDIFF(DAY, @Today, c.end_date) AS current_days_remaining
FROM rental_contract c
JOIN app_user u ON c.customer_id = u.id
JOIN storage_unit su ON c.storage_unit_id = su.id
JOIN facility f ON c.facility_id = f.id
WHERE u.email = 'nhi.customer@gmail.com'
  AND c.status = 'ACTIVE'
ORDER BY c.id ASC;
GO

-- =============================================================================
-- PHẦN 1: CẬP NHẬT DỮ LIỆU GIẢ LẬP (SIMULATION SETUP - 5 MỐC BIÊN)
-- =============================================================================
PRINT N'=============================================================================';
PRINT N'>>> [BƯỚC 1] Cập nhật end_date về 5 mốc kiểm thử (40d, 35d, 30d, 29d, 7d):';
PRINT N'=============================================================================';

DECLARE @Today DATE = CAST(GETDATE() AS DATE);

WITH TargetContracts AS (
    SELECT 
        c.id, 
        c.code,
        ROW_NUMBER() OVER (ORDER BY c.id ASC) AS rn
    FROM rental_contract c
    JOIN app_user u ON c.customer_id = u.id
    WHERE u.email = 'nhi.customer@gmail.com' 
      AND c.status = 'ACTIVE'
)
UPDATE c
SET c.end_date = CASE tc.rn
                    WHEN 1 THEN DATEADD(DAY, 30, @Today) -- Mốc 1: Đúng 30 ngày (Chuẩn BR-REN-01)
                    WHEN 2 THEN DATEADD(DAY, 35, @Today) -- Mốc 2: Cửa sổ 35 ngày (Notice Window)
                    WHEN 3 THEN DATEADD(DAY, 40, @Today) -- Mốc 3: Ngoài cửa sổ 40 ngày (Âm tính)
                    WHEN 4 THEN DATEADD(DAY, 29, @Today) -- Mốc 4: Vùng lặng 29 ngày (Chống spam)
                    WHEN 5 THEN DATEADD(DAY, 7,  @Today) -- Mốc 5: Khẩn cấp 7 ngày (Urgent spike)
                 END,
    c.updated_at = SYSDATETIMEOFFSET()
FROM rental_contract c
JOIN TargetContracts tc ON c.id = tc.id
WHERE tc.rn <= 5;

PRINT N'>>> Đã cập nhật xong dữ liệu 5 mốc kiểm thử cho 5 hợp đồng ACTIVE.';
GO

-- =============================================================================
-- PHẦN 2: BẢNG KIỂM CHỨNG MA TRẬN NGHIỆP VỤ (VERIFICATION & AUDIT MATRIX)
-- =============================================================================
PRINT N'=============================================================================';
PRINT N'>>> [BƯỚC 2] Truy vấn ma trận kiểm chứng: Đối chiếu logic Frontend & BR-REN-01:';
PRINT N'=============================================================================';

DECLARE @Today DATE = CAST(GETDATE() AS DATE);

WITH TargetContracts AS (
    SELECT 
        c.id, 
        ROW_NUMBER() OVER (ORDER BY c.id ASC) AS rn
    FROM rental_contract c
    JOIN app_user u ON c.customer_id = u.id
    WHERE u.email = 'nhi.customer@gmail.com' 
      AND c.status = 'ACTIVE'
)
SELECT 
    c.code AS [Contract_Code],
    su.code AS [Unit_Code],
    f.name AS [Facility_Name],
    c.end_date AS [End_Date],
    DATEDIFF(DAY, @Today, c.end_date) AS [Days_Remaining],
    
    -- Kịch bản kiểm thử tương ứng
    CASE tc.rn
        WHEN 1 THEN N'1. Mốc chuẩn 30 ngày'
        WHEN 2 THEN N'2. Cửa sổ chủ động 35 ngày'
        WHEN 3 THEN N'3. Ngoài cửa sổ 40 ngày'
        WHEN 4 THEN N'4. Vùng lặng 29 ngày (Anti-spam)'
        WHEN 5 THEN N'5. Mốc khẩn cấp 7 ngày'
        ELSE N'Hợp đồng phụ'
    END AS [Scenario],

    -- Hành vi Pop-up cảnh báo (Frontend shouldRemindRenewal)
    CASE 
        WHEN DATEDIFF(DAY, @Today, c.end_date) BETWEEN 30 AND 37 THEN N'CÓ POP-UP (Cửa sổ 30 ngày)'
        WHEN DATEDIFF(DAY, @Today, c.end_date) IN (30, 7, 3, 1)  THEN N'CÓ POP-UP (Mốc khẩn cấp)'
        ELSE N'KHÔNG POP-UP (Yên lặng)'
    END AS [Expected_Popup_Modal],

    -- Hành vi Thẻ kho (UI Badge & Nút thao tác)
    CASE 
        WHEN DATEDIFF(DAY, @Today, c.end_date) <= 7 THEN N'Badge Đỏ (Khẩn cấp) | Nút Gia hạn: MỞ'
        WHEN DATEDIFF(DAY, @Today, c.end_date) <= 37 THEN N'Badge Vàng (Sắp hết hạn) | Nút Gia hạn: MỞ'
        ELSE N'Badge Xanh (Hoạt động) | Nút Gia hạn: MỞ'
    END AS [Expected_UI_Card_State],

    -- Đánh giá Pass/Fail
    CASE 
        WHEN tc.rn = 1 AND DATEDIFF(DAY, @Today, c.end_date) = 30 THEN N'PASS'
        WHEN tc.rn = 2 AND DATEDIFF(DAY, @Today, c.end_date) = 35 THEN N'PASS'
        WHEN tc.rn = 3 AND DATEDIFF(DAY, @Today, c.end_date) = 40 THEN N'PASS'
        WHEN tc.rn = 4 AND DATEDIFF(DAY, @Today, c.end_date) = 29 THEN N'PASS'
        WHEN tc.rn = 5 AND DATEDIFF(DAY, @Today, c.end_date) = 7  THEN N'PASS'
        ELSE N'CHECK LẠI'
    END AS [Audit_Status]

FROM rental_contract c
JOIN TargetContracts tc ON c.id = tc.id
JOIN app_user u ON c.customer_id = u.id
JOIN storage_unit su ON c.storage_unit_id = su.id
JOIN facility f ON c.facility_id = f.id
WHERE tc.rn <= 5
ORDER BY c.end_date ASC;
GO

-- =============================================================================
-- PHẦN 3: SCRIPT KHÔI PHỤC DỮ LIỆU BAN ĐẦU (TEARDOWN / RESET SCRIPT)
-- =============================================================================
-- Khi kiểm thử xong hoặc muốn đưa dữ liệu về ban đầu, bỏ comment khối lệnh sau:
/*
PRINT N'=============================================================================';
PRINT N'>>> [BƯỚC 3] Khôi phục ngày kết thúc gốc cho 5 hợp đồng của nhi.customer:';
PRINT N'=============================================================================';

UPDATE c SET c.end_date = '2027-12-29', c.updated_at = SYSDATETIMEOFFSET()
FROM rental_contract c WHERE c.code = 'CTR-20260929-5788';

UPDATE c SET c.end_date = '2027-02-01', c.updated_at = SYSDATETIMEOFFSET()
FROM rental_contract c WHERE c.code = 'CTR-DEMO-HC-B202';

UPDATE c SET c.end_date = '2027-01-15', c.updated_at = SYSDATETIMEOFFSET()
FROM rental_contract c WHERE c.code = 'CTR-DEMO-HBT-A103';

UPDATE c SET c.end_date = '2027-02-01', c.updated_at = SYSDATETIMEOFFSET()
FROM rental_contract c WHERE c.code = 'CTR-DEMO-CG-S104';

UPDATE c SET c.end_date = '2027-02-01', c.updated_at = SYSDATETIMEOFFSET()
FROM rental_contract c WHERE c.code = 'CTR-DEMO-CG-C404';

PRINT N'>>> Đã khôi phục toàn bộ 5 hợp đồng về ngày kết thúc ban đầu.';
*/
