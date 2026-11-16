-- ==============================================================================
-- Migration V37: Xóa phụ lục gia hạn mẫu của CTR-TEST-002 (ô 102)
-- Để Lead Nhi tự tay bấm nút [Gia hạn] trực tiếp trên giao diện để test luồng
-- ==============================================================================

DELETE FROM contract_renewal 
WHERE contract_id = (SELECT id FROM rental_contract WHERE code = 'CTR-TEST-002');
