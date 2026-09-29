-- V27__close_contract_7182_and_align_unit_status.sql
-- Chuẩn hóa dữ liệu thực tế theo Business Rules:
-- 1. Hợp đồng cũ CTR-20260801-7182 trên ô Q1-B201 đã kết thúc và bàn giao kho ngày 2026-09-26.
--    Chuyển trạng thái sang CLOSED, thu hồi access_code (BR-ACC-03), ghi nhận closed_at và return_date.
-- 2. Hợp đồng mới CTR-20260926-1283 là hợp đồng ACTIVE duy nhất trên ô Q1-B201 (BR-AVL-01, BR-AVL-02).

IF EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260801-7182')
BEGIN
    UPDATE rental_contract
    SET status = 'CLOSED',
        access_code = NULL,
        closed_at = COALESCE(closed_at, SYSDATETIMEOFFSET()),
        return_date = '2026-09-26'
    WHERE code = 'CTR-20260801-7182';

    -- Xóa các yêu cầu trả kho nháp nếu có
    DECLARE @ContractId BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20260801-7182');
    DELETE FROM return_request WHERE contract_id = @ContractId;
END;

-- Đảm bảo trạng thái storage_unit của ô Q1-B201 vẫn là OCCUPIED vì có hợp đồng ACTIVE CTR-20260926-1283
UPDATE su
SET su.status = 'OCCUPIED'
FROM storage_unit su
JOIN rental_contract rc ON su.id = rc.storage_unit_id
WHERE rc.code = 'CTR-20260926-1283' AND rc.status = 'ACTIVE';
