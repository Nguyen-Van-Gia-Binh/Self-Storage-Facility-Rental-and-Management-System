-- V26__align_demo_contracts_business_rules.sql
-- Chuẩn hóa dữ liệu demo theo đúng Business Rules:
-- 1. Hợp đồng ACTIVE: Có access_code (mã PIN 6 số), checkin_date hợp lệ, unit OCCUPIED.
-- 2. Hợp đồng PENDING_RETURN: Có access_code (mã PIN 6 số), checkin_date hợp lệ, unit OCCUPIED, có bản ghi return_request để Staff nghiệm thu.
-- 3. Hợp đồng PENDING_CHECK_IN: access_code = NULL, checkin_date = NULL, unit RESERVED.

-- 1. Đưa hợp đồng CTR-20260801-7182 và CTR-20260915-5291 về ACTIVE đúng chuẩn (nếu đã bị đổi sang PENDING_RETURN trong lúc test)
IF EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260801-7182')
BEGIN
    UPDATE rental_contract
    SET status = 'ACTIVE',
        access_code = '123456',
        return_date = NULL
    WHERE code = 'CTR-20260801-7182';

    -- Xóa các return_request nháp phát sinh trong quá trình bấm test
    DECLARE @C1Id BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20260801-7182');
    DELETE FROM return_request WHERE contract_id = @C1Id;
END;

IF EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260915-5291')
BEGIN
    UPDATE rental_contract
    SET status = 'ACTIVE',
        access_code = '334455',
        return_date = NULL
    WHERE code = 'CTR-20260915-5291';

    DECLARE @C3Id BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20260915-5291');
    DELETE FROM return_request WHERE contract_id = @C3Id;
END;

-- 2. Đảm bảo hợp đồng PENDING_RETURN CTR-20260902-8821 có đầy đủ access_code và return_request
IF EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260902-8821')
BEGIN
    UPDATE rental_contract
    SET status = 'PENDING_RETURN',
        access_code = '654321',
        return_date = '2026-10-01'
    WHERE code = 'CTR-20260902-8821';

    DECLARE @C5Id BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20260902-8821');
    IF NOT EXISTS (SELECT 1 FROM return_request WHERE contract_id = @C5Id)
    BEGIN
        INSERT INTO return_request (
            contract_id, requested_return_date, condition_note, status, created_at
        )
        VALUES (
            @C5Id, '2026-10-01', N'Khách hàng đã dọn sạch đồ đạc trong ngăn tủ, hẹn nhân viên kiểm tra nghiệm thu.', 'PENDING', SYSDATETIMEOFFSET()
        );
    END;
END;

-- 3. Đảm bảo hợp đồng PENDING_CHECK_IN tuyệt đối không có access_code (theo BR-ACC-01 và BR-CHK-04)
UPDATE rental_contract
SET access_code = NULL,
    checkin_date = NULL
WHERE status = 'PENDING_CHECK_IN';

-- 4. Đồng bộ trạng thái storage_unit khớp với hợp đồng
-- Unit có hợp đồng ACTIVE hoặc PENDING_RETURN phải là OCCUPIED
UPDATE su
SET su.status = 'OCCUPIED'
FROM storage_unit su
JOIN rental_contract rc ON su.id = rc.storage_unit_id
WHERE rc.status IN ('ACTIVE', 'PENDING_RETURN');

-- Unit có hợp đồng PENDING_CHECK_IN phải là RESERVED (nếu chưa bị OCCUPIED)
UPDATE su
SET su.status = 'RESERVED'
FROM storage_unit su
JOIN rental_contract rc ON su.id = rc.storage_unit_id
WHERE rc.status = 'PENDING_CHECK_IN'
  AND su.status NOT IN ('OCCUPIED', 'MAINTENANCE');
