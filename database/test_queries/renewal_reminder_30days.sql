-- =============================================================================
-- Query: renewal_reminder_30days.sql
-- Purpose: Lấy các hợp đồng sắp hết hạn (trong vòng 30 ngày) để test
--          chức năng gửi thông báo gia hạn.
--
-- Ngày chạy: 08/10/2026 (VD)
-- Kết quả: Danh sách hợp đồng ACTIVE có endDateExclusive từ ngày mai
--          đến 30 ngày sau, dùng để test chức năng gửi thông báo gia hạn
--          trước 30 ngày theo BR-REN-01.
-- =============================================================================

-- Xem nhanh tất cả hợp đồng sắp hết hạn trong 30 ngày
SELECT
    c.id,
    c.code AS contract_code,
    u.full_name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,
    f.name AS facility_name,
    su.code AS unit_code,
    ut.name AS unit_type_name,
    c.end_date_exclusive,
    DATEDIFF(DAY, CAST(GETDATE() AS DATE), c.end_date_exclusive) AS days_until_expiry,
    c.monthly_price AS monthly_price,
    c.deposit_amount,
    c.status,
    c.overdue_fee_accrued
FROM rental_contract c
JOIN app_user u ON c.customer_id = u.id
JOIN facility f ON c.facility_id = f.id
JOIN storage_unit su ON c.storage_unit_id = su.id
JOIN unit_type ut ON c.unit_type_id = ut.id
WHERE c.status = 'ACTIVE'
  AND c.end_date_exclusive > CAST(GETDATE() AS DATE)
  AND c.end_date_exclusive <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE))
ORDER BY c.end_date_exclusive ASC;

-- Thống kê số lượng theo nhóm ngày
SELECT
    CASE
        WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), c.end_date_exclusive) <= 7 THEN '1-7 ngày'
        WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), c.end_date_exclusive) <= 14 THEN '8-14 ngày'
        WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), c.end_date_exclusive) <= 21 THEN '15-21 ngày'
        ELSE '22-30 ngày'
    END AS expiry_group,
    COUNT(*) AS contract_count
FROM rental_contract c
WHERE c.status = 'ACTIVE'
  AND c.end_date_exclusive > CAST(GETDATE() AS DATE)
  AND c.end_date_exclusive <= DATEADD(DAY, 30, CAST(GETDATE() AS DATE))
GROUP BY
    CASE
        WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), c.end_date_exclusive) <= 7 THEN '1-7 ngày'
        WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), c.end_date_exclusive) <= 14 THEN '8-14 ngày'
        WHEN DATEDIFF(DAY, CAST(GETDATE() AS DATE), c.end_date_exclusive) <= 21 THEN '15-21 ngày'
        ELSE '22-30 ngày'
    END
ORDER BY
    CASE expiry_group
        WHEN '1-7 ngày' THEN 1
        WHEN '8-14 ngày' THEN 2
        WHEN '15-21 ngày' THEN 3
        WHEN '22-30 ngày' THEN 4
    END;
