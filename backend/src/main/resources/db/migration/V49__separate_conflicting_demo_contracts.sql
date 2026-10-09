/* ============================================================================
   Flyway Migration V49__separate_conflicting_demo_contracts.sql
   Phân tách các hợp đồng bị gán trùng lặp trên cùng 1 ô kho:

   1. Ô CG-S101 (Cầu Giấy):
      - CTR-202610-0001 (Nguyễn Văn Khách) là hợp đồng thuê dài hạn chính thức trên CG-S101.
      - CTR-20260901-3814 (Trần Yến Nhi) bị V21 chuyển nhầm từ CG-M204 sang CG-S101.
      -> Đưa CTR-20260901-3814 và RSV-20260901-3814 về đúng ô CG-M204 (Kho Vừa Cầu Giấy).
      -> Đặt ô CG-M204 thành OCCUPIED, trả ô CG-S101 về duy nhất cho Nguyễn Văn Khách.

   2. Ô Q7-A104 (Quận 7):
      - Ô đã có hợp đồng PENDING_RETURN CTR-20260902-8821.
      - Xóa bỏ hợp đồng demo thừa CTR-DEMO-Q7-A104 và đơn RES-DEMO-Q7-A104.

   3. Ô Q1-A101 (Quận 1):
      - Tách hợp đồng CTR-20260625-8802 (Trần Yến Nhi) sang ô Q1-A102 (Kho Nhỏ cùng loại đang trống).
      - Đặt ô Q1-A102 thành OCCUPIED, chuyển access_credential sang Q1-A102, trả ô Q1-A101 về AVAILABLE.

   4. Bảo đảm tính toàn vẹn dữ liệu (Audit Safeguards):
      - Quét và chuyển tất cả ô OCCUPIED / RESERVED mồ côi về AVAILABLE.
      - Đồng bộ các ô có hợp đồng hoạt động thành OCCUPIED.
   ============================================================================ */

-- ============================================================================
-- 1. ĐƯA CTR-20260901-3814 VỀ ĐÚNG Ô CG-M204 (Kho Vừa Cầu Giấy)
-- ============================================================================
IF EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260901-3814')
BEGIN
    DECLARE @SuCgM204Id BIGINT = (
        SELECT su.id FROM storage_unit su 
        JOIN facility f ON su.facility_id = f.id 
        WHERE f.code = 'FAC-CG' AND su.code = 'CG-M204'
    );
    DECLARE @UtMediumId BIGINT = (
        SELECT id FROM unit_type WHERE code = 'UT-MEDIUM'
    );

    IF @SuCgM204Id IS NOT NULL
    BEGIN
        -- Cập nhật hợp đồng
        UPDATE rental_contract
        SET storage_unit_id = @SuCgM204Id,
            unit_type_id = @UtMediumId
        WHERE code = 'CTR-20260901-3814';

        -- Cập nhật đơn đặt chỗ
        UPDATE reservation
        SET storage_unit_id = @SuCgM204Id,
            unit_type_id = @UtMediumId
        WHERE code = 'RSV-20260901-3814';

        -- Cập nhật phiếu sự cố nếu có
        UPDATE support_request
        SET storage_unit_id = @SuCgM204Id
        WHERE contract_id = (SELECT id FROM rental_contract WHERE code = 'CTR-20260901-3814');

        -- Đặt ô CG-M204 thành OCCUPIED
        UPDATE storage_unit
        SET status = 'OCCUPIED'
        WHERE id = @SuCgM204Id;
    END;
END;

-- ============================================================================
-- 2. DỌN DẸP HỢP ĐỒNG THỪA CTR-DEMO-Q7-A104 TRÊN Ô Q7-A104
-- ============================================================================
IF EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-DEMO-Q7-A104')
BEGIN
    DELETE FROM rental_contract WHERE code = 'CTR-DEMO-Q7-A104';
    DELETE FROM reservation WHERE code = 'RES-DEMO-Q7-A104';
END;

-- ============================================================================
-- 3. PHÂN TÁCH CTR-20260625-8802 SANG Ô Q1-A102 (Kho Nhỏ Quận 1)
-- ============================================================================
IF EXISTS (SELECT 1 FROM rental_contract WHERE code = 'CTR-20260625-8802')
BEGIN
    DECLARE @SuQ1A102Id BIGINT = (
        SELECT su.id FROM storage_unit su 
        JOIN facility f ON su.facility_id = f.id 
        WHERE f.code = 'FAC-Q1' AND su.code = 'Q1-A102'
    );

    IF @SuQ1A102Id IS NOT NULL
    BEGIN
        UPDATE rental_contract
        SET storage_unit_id = @SuQ1A102Id
        WHERE code = 'CTR-20260625-8802';

        UPDATE reservation
        SET storage_unit_id = @SuQ1A102Id
        WHERE code = 'RSV-20260625-8802';

        -- Cập nhật access_credential sang ô Q1-A102
        UPDATE access_credential
        SET storage_unit_id = @SuQ1A102Id
        WHERE contract_id = (SELECT id FROM rental_contract WHERE code = 'CTR-20260625-8802');

        -- Đặt ô Q1-A102 thành OCCUPIED
        UPDATE storage_unit
        SET status = 'OCCUPIED'
        WHERE id = @SuQ1A102Id;

        -- Đặt lại ô Q1-A101 về AVAILABLE nếu không còn hợp đồng hoạt động
        UPDATE su
        SET su.status = 'AVAILABLE'
        FROM storage_unit su
        JOIN facility f ON su.facility_id = f.id
        WHERE f.code = 'FAC-Q1' AND su.code = 'Q1-A101'
          AND NOT EXISTS (
              SELECT 1 FROM rental_contract rc 
              WHERE rc.storage_unit_id = su.id 
                AND rc.status IN ('ACTIVE', 'OVERDUE', 'PENDING_RETURN', 'PENDING_CHECK_IN')
          );
    END;
END;

-- ============================================================================
-- 4. BẢO ĐẢM TÍNH TOÀN VẸN TOÀN HỆ THỐNG (DATA INTEGRITY AUDIT SAFEGUARDS)
-- ============================================================================
-- 4.1. Đưa tất cả các ô kho OCCUPIED mồ côi (không có hợp đồng hoạt động) về AVAILABLE
UPDATE su
SET su.status = 'AVAILABLE'
FROM storage_unit su
WHERE su.status = 'OCCUPIED'
  AND NOT EXISTS (
      SELECT 1 FROM rental_contract rc 
      WHERE rc.storage_unit_id = su.id 
        AND rc.status IN ('ACTIVE', 'OVERDUE', 'PENDING_RETURN', 'PENDING_CHECK_IN')
  );

-- 4.2. Đưa tất cả các ô kho RESERVED mồ côi (không có đơn giữ chỗ hoặc hợp đồng chờ check-in) về AVAILABLE
UPDATE su
SET su.status = 'AVAILABLE'
FROM storage_unit su
WHERE su.status = 'RESERVED'
  AND NOT EXISTS (
      SELECT 1 FROM reservation r 
      WHERE r.storage_unit_id = su.id 
        AND r.status IN ('PENDING_PAYMENT', 'CONFIRMED')
  )
  AND NOT EXISTS (
      SELECT 1 FROM rental_contract rc 
      WHERE rc.storage_unit_id = su.id 
        AND rc.status = 'PENDING_CHECK_IN'
  );

-- 4.3. Đảm bảo mọi ô kho đang có hợp đồng ACTIVE / OVERDUE / PENDING_RETURN đều mang trạng thái OCCUPIED
UPDATE su
SET su.status = 'OCCUPIED'
FROM storage_unit su
JOIN rental_contract rc ON su.id = rc.storage_unit_id
WHERE rc.status IN ('ACTIVE', 'OVERDUE', 'PENDING_RETURN')
  AND su.status <> 'OCCUPIED';

