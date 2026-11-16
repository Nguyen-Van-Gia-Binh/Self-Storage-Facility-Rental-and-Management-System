-- ==============================================================================
-- Migration V38: Gắn relocation_support_request_id vào CTR-TEST-014
-- Để hiển thị đầy đủ Phụ lục điều chuyển ô kho (Sự cố kỹ thuật)
-- ==============================================================================

UPDATE rental_contract
SET relocation_support_request_id = (SELECT id FROM support_request WHERE code = 'SUP-202611-0088' LIMIT 1)
WHERE code = 'CTR-TEST-014';
