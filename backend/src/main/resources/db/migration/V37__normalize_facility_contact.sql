-- BR-GEN-07: chuẩn hóa số điện thoại và giờ hoạt động của Facility hiện có
-- 024-3795-8888 -> 0243795888; 00:00–24:00 (24/7) -> 00:00–23:59

WHILE EXISTS (
    SELECT 1 FROM facility
    WHERE phone IS NOT NULL AND phone LIKE '%[^0-9]%'
)
BEGIN
    UPDATE facility
    SET phone = STUFF(phone, PATINDEX('%[^0-9]%', phone), 1, '')
    WHERE phone IS NOT NULL AND phone LIKE '%[^0-9]%';
END;

UPDATE facility
SET phone = NULL,
    updated_at = SYSDATETIMEOFFSET()
WHERE phone IS NOT NULL
  AND phone NOT LIKE '0[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]';

UPDATE facility
SET opening_hours = N'00:00–23:59',
    updated_at = SYSDATETIMEOFFSET()
WHERE opening_hours LIKE N'%24:00%'
   OR opening_hours LIKE N'%24/7%';
