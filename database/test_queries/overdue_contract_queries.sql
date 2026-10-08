-- =============================================================================
-- Query: overdue_contract_queries.sql
-- Purpose: Lấy thông tin hợp đồng quá hạn theo các nhóm ngày để test
--          chức năng xử lý quá hạn và hiển thị trạng thái.
--
-- Quy tắc xử lý quá hạn (theo BR-OVD-*):
--   - D+1..D+3  (1-3 ngày): Ân hạn, phí = 0, accessCode còn
--   - D+4..D+9  (4-9 ngày): Phạt lũy tiến 10%/ngày, accessCode còn (đến D+7)
--   - D+7..D+9  (7-9 ngày): Khóa mã truy cập (BR-OVD-05)
--   - D+10+     (10+ ngày): Cưỡng chế chấm dứt, TERMINATED, kho CLEANING
--
-- Ngày chạy: 08/10/2026 (VD - hãy thay đổi theo ngày thực tế)
-- =============================================================================

-- Lấy ngày hiện tại để tính overdueDays
DECLARE @Today DATE = CAST(GETDATE() AS DATE);

-- =============================================================================
-- NHÓM 1: Quá hạn 1-3 ngày (Ân hạn)
-- BR-OVD-01: Không tính phí trong 3 ngày đầu
-- BR-OVD-02: AccessCode vẫn mở để khách dọn đồ
-- =============================================================================
SELECT
    c.id,
    c.code AS contract_code,
    u.full_name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    f.name AS facility_name,
    su.code AS unit_code,
    c.end_date_exclusive,
    DATEDIFF(DAY, c.end_date_exclusive, @Today) AS overdue_days,
    c.deposit_amount,
    c.deposit_balance,
    c.overdue_fee_accrued,
    c.access_code,
    c.status,
    CASE WHEN c.access_code IS NOT NULL THEN 'MỞ' ELSE 'KHÓA' END AS access_status,
    CASE
        WHEN c.overdue_fee_accrued = 0 THEN 'Đúng: 0đ (ân hạn)'
        ELSE 'SAI: Phải = 0đ'
    END AS fee_check
FROM rental_contract c
JOIN app_user u ON c.customer_id = u.id
JOIN facility f ON c.facility_id = f.id
JOIN storage_unit su ON c.storage_unit_id = su.id
WHERE c.end_date_exclusive < @Today
  AND DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 1 AND 3
  AND c.status IN ('ACTIVE', 'OVERDUE')
ORDER BY c.end_date_exclusive DESC;

-- =============================================================================
-- NHÓM 2: Quá hạn 4-9 ngày (Phạt lũy tiến)
-- BR-OVD-03: Từ ngày thứ 4, phạt 10%/ngày * tiền cọc
-- BR-OVD-04: Trần phạt 70% tiền cọc
-- =============================================================================
SELECT
    c.id,
    c.code AS contract_code,
    u.full_name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    f.name AS facility_name,
    su.code AS unit_code,
    c.end_date_exclusive,
    DATEDIFF(DAY, c.end_date_exclusive, @Today) AS overdue_days,
    c.deposit_amount,
    c.deposit_balance,
    c.overdue_fee_accrued,
    c.access_code,
    c.status,
    -- Tính phí mong đợi
    DATEDIFF(DAY, c.end_date_exclusive, @Today) - 3 AS days_to_charge,
    CAST(c.deposit_amount * 0.10 * (DATEDIFF(DAY, c.end_date_exclusive, @Today) - 3) AS BIGINT) AS expected_fee,
    -- Kiểm tra phí đã tính
    CASE
        WHEN c.overdue_fee_accrued = CAST(c.deposit_amount * 0.10 * (DATEDIFF(DAY, c.end_date_exclusive, @Today) - 3) AS BIGINT)
            THEN 'Đúng'
        ELSE 'SAI: Kiểm tra lại logic tính phí'
    END AS fee_check
FROM rental_contract c
JOIN app_user u ON c.customer_id = u.id
JOIN facility f ON c.facility_id = f.id
JOIN storage_unit su ON c.storage_unit_id = su.id
WHERE c.end_date_exclusive < @Today
  AND DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 4 AND 9
  AND c.status IN ('ACTIVE', 'OVERDUE')
ORDER BY c.end_date_exclusive DESC;

-- =============================================================================
-- NHÓM 3: Quá hạn 7-9 ngày (Khóa mã truy cập)
-- BR-OVD-05: Từ D+7, khóa accessCode (mã PIN không mở được)
-- =============================================================================
SELECT
    c.id,
    c.code AS contract_code,
    u.full_name AS customer_name,
    f.name AS facility_name,
    su.code AS unit_code,
    c.end_date_exclusive,
    DATEDIFF(DAY, c.end_date_exclusive, @Today) AS overdue_days,
    c.deposit_amount,
    c.overdue_fee_accrued,
    c.access_code,
    c.status,
    CASE WHEN c.access_code IS NULL THEN 'Đúng: ĐÃ KHÓA' ELSE 'SAI: Phải khóa (null)' END AS access_check
FROM rental_contract c
JOIN app_user u ON c.customer_id = u.id
JOIN facility f ON c.facility_id = f.id
JOIN storage_unit su ON c.storage_unit_id = su.id
WHERE c.end_date_exclusive < @Today
  AND DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 7 AND 9
  AND c.status IN ('ACTIVE', 'OVERDUE')
ORDER BY c.end_date_exclusive DESC;

-- =============================================================================
-- NHÓM 4: Quá hạn 10+ ngày (Cưỡng chế chấm dứt)
-- BR-OVD-07: Cưỡng chế chấm dứt tại D+10
-- =============================================================================
SELECT
    c.id,
    c.code AS contract_code,
    u.full_name AS customer_name,
    f.name AS facility_name,
    su.code AS unit_code,
    c.end_date_exclusive,
    DATEDIFF(DAY, c.end_date_exclusive, @Today) AS overdue_days,
    c.deposit_amount,
    c.overdue_fee_accrued,
    c.deposit_balance,
    c.access_code,
    c.status,
    su.status AS unit_status,
    CASE
        WHEN c.status = 'TERMINATED' THEN 'Đúng: ĐÃ CHẤM DỨT'
        ELSE 'SAI: Phải là TERMINATED'
    END AS status_check,
    CASE
        WHEN su.status = 'CLEANING' THEN 'Đúng: Đang dọn đồ'
        ELSE 'SAI: Phải là CLEANING'
    END AS unit_check
FROM rental_contract c
JOIN app_user u ON c.customer_id = u.id
JOIN facility f ON c.facility_id = f.id
JOIN storage_unit su ON c.storage_unit_id = su.id
WHERE c.end_date_exclusive < @Today
  AND DATEDIFF(DAY, c.end_date_exclusive, @Today) >= 10
  AND c.status IN ('ACTIVE', 'OVERDUE', 'TERMINATED')
ORDER BY c.end_date_exclusive DESC;

-- =============================================================================
-- TỔNG HỢP: Thống kê quá hạn theo nhóm
-- =============================================================================
SELECT
    CASE
        WHEN DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 1 AND 3 THEN '1-3 ngày (Ân hạn)'
        WHEN DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 4 AND 6 THEN '4-6 ngày (Phạt 10%/ngày)'
        WHEN DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 7 AND 9 THEN '7-9 ngày (Khóa mã)'
        ELSE '10+ ngày (Cưỡng chế)'
    END AS overdue_group,
    COUNT(*) AS total_contracts,
    SUM(c.overdue_fee_accrued) AS total_fees_accrued,
    SUM(CASE WHEN c.status = 'TERMINATED' THEN 1 ELSE 0 END) AS terminated_count,
    SUM(CASE WHEN c.access_code IS NULL THEN 1 ELSE 0 END) AS locked_access_count
FROM rental_contract c
WHERE c.end_date_exclusive < @Today
  AND c.status IN ('ACTIVE', 'OVERDUE', 'TERMINATED')
GROUP BY
    CASE
        WHEN DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 1 AND 3 THEN '1-3 ngày (Ân hạn)'
        WHEN DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 4 AND 6 THEN '4-6 ngày (Phạt 10%/ngày)'
        WHEN DATEDIFF(DAY, c.end_date_exclusive, @Today) BETWEEN 7 AND 9 THEN '7-9 ngày (Khóa mã)'
        ELSE '10+ ngày (Cưỡng chế)'
    END
ORDER BY
    CASE overdue_group
        WHEN '1-3 ngày (Ân hạn)' THEN 1
        WHEN '4-6 ngày (Phạt 10%/ngày)' THEN 2
        WHEN '7-9 ngày (Khóa mã)' THEN 3
        WHEN '10+ ngày (Cưỡng chế)' THEN 4
    END;
