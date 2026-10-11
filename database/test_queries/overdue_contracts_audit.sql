-- =============================================================================
-- TRUY VẤN RÀ SOÁT & KIỂM TOÁN QUÁ HẠN TOÀN HỆ THỐNG (OVERDUE CONTRACT AUDIT)
-- Đường dẫn: database/test_queries/overdue_contracts_audit.sql
-- Mục đích: Dành cho Ban Vận Hành (BOM) và Quản lý Cơ sở (FM) rà soát, phân loại
--           toàn bộ hợp đồng quá hạn trong hệ thống vào 4 phân tầng rủi ro
--           theo quy định BR-OVD-01..08.
--
-- HƯỚNG DẪN CHẠY NHANH CHO CẢ NHÓM (QUICK RUN GUIDE):
-- -----------------------------------------------------------------------------
-- [Cách 1] Chạy trên Docker (PowerShell):
--   Get-Content database/test_queries/overdue_contracts_audit.sql -Raw | docker exec -i sqlserver-selfstorage /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourPassword123" -d SelfStorageDB -C
--
-- [Cách 2] Chạy trên SQL Server cài cục bộ (Localhost Windows sqlcmd):
--   sqlcmd -S localhost -U sa -P "YourPassword123" -d SelfStorageDB -i database/test_queries/overdue_contracts_audit.sql
--   (Nếu dùng Windows Auth: sqlcmd -S localhost -E -d SelfStorageDB -i database/test_queries/overdue_contracts_audit.sql)
--
-- [Cách 3] Chạy qua công cụ GUI (SSMS / Azure Data Studio / DBeaver / DataGrip):
--   Mở file này, chọn Database 'SelfStorageDB', nhấn nút Execute (phím F5).
-- -----------------------------------------------------------------------------
-- =============================================================================

USE SelfStorageDB;
GO

DECLARE @Today DATE = CAST(GETDATE() AS DATE);
SELECT @Today AS [Audit_Date_Today];

-- =============================================================================
-- 1. DANH SÁCH CHI TIẾT CÁC HỢP ĐỒNG ĐANG QUÁ HẠN (PHÂN LOẠI 4 BUCKET)
-- =============================================================================
WITH OverdueClassified AS (
    SELECT
        c.id,
        c.code AS contract_code,
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        f.name AS facility_name,
        su.code AS unit_code,
        su.status AS unit_status,
        c.status AS contract_status,
        c.end_date,
        DATEDIFF(DAY, c.end_date, @Today) AS days_overdue,
        c.deposit_amount,
        c.overdue_fee_accrued,
        c.deposit_balance,
        CASE WHEN c.access_code IS NOT NULL THEN N'ĐANG MỞ' ELSE N'BỊ KHÓA' END AS access_pin_status,
        
        -- Phân loại 4 Bucket nghiệp vụ
        CASE 
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 1 AND 3 THEN N'Bucket 1: Ân hạn D+1..D+3 (0% phạt)'
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 4 AND 6 THEN N'Bucket 2: Phạt nợ D+4..D+6 (10%/ngày)'
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 7 AND 9 THEN N'Bucket 3: Khóa PIN D+7..D+9'
            WHEN DATEDIFF(DAY, c.end_date, @Today) >= 10            THEN N'Bucket 4: Chấm dứt & Dọn kho D+10+'
            ELSE N'Chưa quá hạn'
        END AS overdue_bucket,

        -- Hướng hành động đề xuất cho FM / Staff
        CASE 
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 1 AND 3 THEN N'Gửi thông báo nhắc dọn đồ; khách được hoàn 100% cọc nếu trả kho ngay'
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 4 AND 6 THEN N'Cảnh báo nợ tăng dần 10%/ngày; yêu cầu nộp phạt trước khi xử lý'
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 7 AND 9 THEN N'Mã số mở cửa đã bị khóa; hỗ trợ giám sát nếu khách đến dọn đồ'
            WHEN DATEDIFF(DAY, c.end_date, @Today) >= 10            THEN N'Chấm dứt hợp đồng; Staff lập biên bản niêm phong tài sản về kho tổng'
            ELSE N'Theo dõi bình thường'
        END AS recommended_action

    FROM rental_contract c
    JOIN app_user u ON c.customer_id = u.id
    JOIN facility f ON c.facility_id = f.id
    JOIN storage_unit su ON c.storage_unit_id = su.id
    WHERE c.status IN ('OVERDUE', 'TERMINATED')
       OR (c.status = 'ACTIVE' AND c.end_date < @Today)
)
SELECT 
    contract_code,
    customer_name,
    customer_phone,
    facility_name,
    unit_code,
    contract_status,
    days_overdue,
    overdue_bucket,
    deposit_amount,
    overdue_fee_accrued,
    access_pin_status,
    recommended_action
FROM OverdueClassified
ORDER BY days_overdue DESC;

-- =============================================================================
-- 2. BẢNG THỐNG KÊ TỔNG HỢP RỦI RO QUÁ HẠN THEO TỪNG NHÓM (KPI SUMMARY)
-- =============================================================================
WITH OverdueSummary AS (
    SELECT
        CASE 
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 1 AND 3 THEN N'1. Ân hạn D+1..D+3'
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 4 AND 6 THEN N'2. Phạt nợ D+4..D+6'
            WHEN DATEDIFF(DAY, c.end_date, @Today) BETWEEN 7 AND 9 THEN N'3. Khóa PIN D+7..D+9'
            WHEN DATEDIFF(DAY, c.end_date, @Today) >= 10            THEN N'4. Chấm dứt D+10+'
            ELSE N'0. Chưa quá hạn'
        END AS bucket_name,
        c.deposit_amount,
        c.overdue_fee_accrued
    FROM rental_contract c
    WHERE c.status IN ('OVERDUE', 'TERMINATED')
       OR (c.status = 'ACTIVE' AND c.end_date < @Today)
)
SELECT 
    bucket_name AS [Giai_Doan_Qua_Han],
    COUNT(*) AS [So_Luong_Hop_Dong],
    SUM(deposit_amount) AS [Tong_Tien_Coc_Giu (VND)],
    SUM(overdue_fee_accrued) AS [Tong_Phi_Phat_Phat_Sinh (VND)]
FROM OverdueSummary
GROUP BY bucket_name
ORDER BY bucket_name ASC;
GO
