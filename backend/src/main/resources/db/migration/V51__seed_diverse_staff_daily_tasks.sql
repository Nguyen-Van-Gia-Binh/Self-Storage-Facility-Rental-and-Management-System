/* ============================================================================
   Flyway Migration V51__seed_diverse_staff_daily_tasks.sql
   Bổ sung bộ dữ liệu ca trực mẫu đa dạng toàn diện cho tài khoản:
   - Email: staff@storage.vn
   - Mật khẩu: password123
   - Nhân viên: Trần Thị Nhân Viên (ID tương ứng trong app_user)

   Nội dung dữ liệu mẫu bao phủ trọn vẹn 3 trụ cột nghiệp vụ:
   1. Lịch Check-in tiếp đón nhận kho:
      - Đơn chờ tiếp đón (PENDING_CHECK_IN) tại Cầu Giấy (CG-S103) & Quận 1 (Q1-A104)
      - Đơn đã hoàn tất bàn giao trong ca (ACTIVE / COMPLETED) tại Cầu Giấy (CG-M201)
   2. Lịch Trả kho & Nghiệm thu phòng:
      - Đơn chờ nghiệm thu (PENDING_RETURN) tại Cầu Giấy (CG-M202) & Quận 1 (Q1-B201)
      - Đơn đã nghiệm thu thành công (INSPECTED / COMPLETED) tại Cầu Giấy (CG-L301)
   3. Sự cố kỹ thuật & Vận hành thực địa:
      - Sự cố Mới (NEW): Kẹt khóa số điện tử (LOCK_ACCESS)
      - Sự cố Đang xử lý (IN_PROGRESS): Hư hỏng ray trượt cửa kho (UNIT_DAMAGE)
      - Sự cố Đổi kho (IN_PROGRESS): Ngấm ẩm vách ngăn cần di dời (UNIT_DAMAGE - relocation)
      - Sự cố Đã khắc phục (RESOLVED): Vệ sinh khử khuẩn bàn giao (OTHER)
   ============================================================================ */

-- 1. Xác định ID các vai trò cần thiết
DECLARE @StaffId BIGINT = (SELECT TOP 1 id FROM app_user WHERE email = 'staff@storage.vn');
DECLARE @ManagerId BIGINT = (SELECT TOP 1 id FROM app_user WHERE role = 'FACILITY_MANAGER' AND status = 'ACTIVE' ORDER BY id ASC);
DECLARE @CustNhiId BIGINT = (SELECT TOP 1 id FROM app_user WHERE email = 'nhi.customer@gmail.com');
DECLARE @CustStorageId BIGINT = (SELECT TOP 1 id FROM app_user WHERE email = 'customer@storage.vn');
DECLARE @PolicyVersionId BIGINT = (SELECT TOP 1 id FROM policy_version ORDER BY version_no DESC);

-- Đảm bảo khách hàng thứ 3 (Hoàng Nam) tồn tại phục vụ tính đa dạng
IF NOT EXISTS (SELECT 1 FROM app_user WHERE email = 'hoang.nam@gmail.com')
BEGIN
    INSERT INTO app_user (email, password_hash, full_name, phone, identity_number, role, status)
    VALUES ('hoang.nam@gmail.com', '$2a$10$gSvQSZaz9/5Ap9jd8N4q2.WVh/VDWgittildEDGv4VWn4lyPce2Pi', N'Hoàng Văn Nam', '0918234567', '079099008899', 'STORAGE_CUSTOMER', 'ACTIVE');
END;
DECLARE @CustNamId BIGINT = (SELECT id FROM app_user WHERE email = 'hoang.nam@gmail.com');

-- Đảm bảo policy_version tồn tại
IF @PolicyVersionId IS NULL
BEGIN
    SET @PolicyVersionId = 1;
END;

-- Lấy ngày kiểm thử chính (mock 2026-10-12) và ngày hiện tại của máy chủ
DECLARE @TestDate DATE = '2026-10-12';
DECLARE @RealDate DATE = CAST(GETDATE() AS DATE);

-- ============================================================================
-- A. CHECK-IN TASKS (LỊCH NHẬN KHO & TIẾP ĐÓN)
-- ============================================================================

-- A1. Check-in 1: Chờ tiếp đón tại Cầu Giấy (CG-S103, UT-SMALL)
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-STAFF-CK01')
BEGIN
    DECLARE @FacCgId BIGINT = (SELECT id FROM facility WHERE code = 'FAC-CG');
    DECLARE @SuCgS103Id BIGINT = (SELECT id FROM storage_unit WHERE facility_id = @FacCgId AND code = 'CG-S103');
    IF @SuCgS103Id IS NULL
        SET @SuCgS103Id = (SELECT TOP 1 id FROM storage_unit WHERE facility_id = @FacCgId);

    DECLARE @UtSmallId BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-SMALL');

    -- Đặt trạng thái ô kho sang RESERVED
    UPDATE storage_unit SET status = 'RESERVED' WHERE id = @SuCgS103Id;

    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    VALUES (
        'RSV-STAFF-CK01', @CustStorageId, @FacCgId, @UtSmallId, @SuCgS103Id,
        @TestDate, 3, DATEADD(MONTH, 3, @TestDate), 500000,
        @PolicyVersionId, 500000, 1500000, 2000000,
        'CONFIRMED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), NULL
    );

    DECLARE @RsvCk1Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    VALUES (
        'CTR-20261012-1011', @RsvCk1Id, @CustStorageId, @FacCgId, @SuCgS103Id, @UtSmallId,
        @TestDate, DATEADD(MONTH, 3, @TestDate), 3, 500000,
        1500000, 500000, 500000, NULL,
        'PENDING_CHECK_IN', NULL, @PolicyVersionId, 0
    );

    DECLARE @CtrCk1Id BIGINT = SCOPE_IDENTITY();

    -- Phân công trực tiếp cho staff@storage.vn trên bảng staff_daily_assignment
    INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
    VALUES (@StaffId, @FacCgId, @TestDate, 'HANDOVER', 'CONTRACT', @CtrCk1Id, @ManagerId);

    IF @RealDate <> @TestDate
    BEGIN
        INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
        VALUES (@StaffId, @FacCgId, @RealDate, 'HANDOVER', 'CONTRACT', @CtrCk1Id, @ManagerId);
    END;
END;

-- A2. Check-in 2: Chờ tiếp đón tại Quận 1 (Q1-A104, UT-MEDIUM)
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-STAFF-CK02')
BEGIN
    DECLARE @FacQ1Id BIGINT = (SELECT id FROM facility WHERE code = 'FAC-Q1');
    DECLARE @SuQ1A104Id BIGINT = (SELECT id FROM storage_unit WHERE facility_id = @FacQ1Id AND code = 'Q1-A104');
    IF @SuQ1A104Id IS NULL
        SET @SuQ1A104Id = (SELECT TOP 1 id FROM storage_unit WHERE facility_id = @FacQ1Id);

    DECLARE @UtMedId BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-MEDIUM');

    UPDATE storage_unit SET status = 'RESERVED' WHERE id = @SuQ1A104Id;

    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    VALUES (
        'RSV-STAFF-CK02', @CustNhiId, @FacQ1Id, @UtMedId, @SuQ1A104Id,
        @TestDate, 6, DATEADD(MONTH, 6, @TestDate), 1200000,
        @PolicyVersionId, 1200000, 7200000, 8400000,
        'CONFIRMED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), NULL
    );

    DECLARE @RsvCk2Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    VALUES (
        'CTR-20261012-1022', @RsvCk2Id, @CustNhiId, @FacQ1Id, @SuQ1A104Id, @UtMedId,
        @TestDate, DATEADD(MONTH, 6, @TestDate), 6, 1200000,
        7200000, 1200000, 1200000, NULL,
        'PENDING_CHECK_IN', NULL, @PolicyVersionId, 0
    );

    DECLARE @CtrCk2Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
    VALUES (@StaffId, @FacQ1Id, @TestDate, 'HANDOVER', 'CONTRACT', @CtrCk2Id, @ManagerId);

    IF @RealDate <> @TestDate
    BEGIN
        INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
        VALUES (@StaffId, @FacQ1Id, @RealDate, 'HANDOVER', 'CONTRACT', @CtrCk2Id, @ManagerId);
    END;
END;

-- A3. Check-in 3: Đã bàn giao xong trong ca trực (ACTIVE) tại Cầu Giấy (CG-M201)
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-STAFF-CK03')
BEGIN
    DECLARE @FacCgId3 BIGINT = (SELECT id FROM facility WHERE code = 'FAC-CG');
    DECLARE @SuCgM201Id BIGINT = (SELECT id FROM storage_unit WHERE facility_id = @FacCgId3 AND code = 'CG-M201');
    IF @SuCgM201Id IS NULL
        SET @SuCgM201Id = (SELECT TOP 1 id FROM storage_unit WHERE facility_id = @FacCgId3);

    DECLARE @UtMedId3 BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-MEDIUM');

    UPDATE storage_unit SET status = 'OCCUPIED' WHERE id = @SuCgM201Id;

    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    VALUES (
        'RSV-STAFF-CK03', @CustNamId, @FacCgId3, @UtMedId3, @SuCgM201Id,
        @TestDate, 3, DATEADD(MONTH, 3, @TestDate), 1200000,
        @PolicyVersionId, 1200000, 3600000, 4800000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    );

    DECLARE @RsvCk3Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, policy_version_id, overdue_fee_accrued
    )
    VALUES (
        'CTR-20261012-1033', @RsvCk3Id, @CustNamId, @FacCgId3, @SuCgM201Id, @UtMedId3,
        @TestDate, DATEADD(MONTH, 3, @TestDate), 3, 1200000,
        3600000, 1200000, 1200000, '849201',
        'ACTIVE', @TestDate, @PolicyVersionId, 0
    );

    DECLARE @CtrCk3Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
    VALUES (@StaffId, @FacCgId3, @TestDate, 'HANDOVER', 'CONTRACT', @CtrCk3Id, @ManagerId);

    IF @RealDate <> @TestDate
    BEGIN
        INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
        VALUES (@StaffId, @FacCgId3, @RealDate, 'HANDOVER', 'CONTRACT', @CtrCk3Id, @ManagerId);
    END;
END;

-- ============================================================================
-- B. RETURN & INSPECTION TASKS (LỊCH TRẢ KHO & NGHIỆM THU)
-- ============================================================================

-- B1. Return 1: Chờ nghiệm thu phòng (PENDING_RETURN) tại Cầu Giấy (CG-M202)
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-STAFF-RT01')
BEGIN
    DECLARE @FacCgIdB1 BIGINT = (SELECT id FROM facility WHERE code = 'FAC-CG');
    DECLARE @SuCgM202Id BIGINT = (SELECT id FROM storage_unit WHERE facility_id = @FacCgIdB1 AND code = 'CG-M202');
    IF @SuCgM202Id IS NULL
        SET @SuCgM202Id = (SELECT TOP 1 id FROM storage_unit WHERE facility_id = @FacCgIdB1);

    DECLARE @UtMedIdB1 BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-MEDIUM');

    UPDATE storage_unit SET status = 'OCCUPIED' WHERE id = @SuCgM202Id;

    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    VALUES (
        'RSV-STAFF-RT01', @CustNhiId, @FacCgIdB1, @UtMedIdB1, @SuCgM202Id,
        DATEADD(MONTH, -3, @TestDate), 3, @TestDate, 1200000,
        @PolicyVersionId, 1200000, 3600000, 4800000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    );

    DECLARE @RsvRt1Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, return_date, policy_version_id, overdue_fee_accrued
    )
    VALUES (
        'CTR-20261012-2011', @RsvRt1Id, @CustNhiId, @FacCgIdB1, @SuCgM202Id, @UtMedIdB1,
        DATEADD(MONTH, -3, @TestDate), @TestDate, 3, 1200000,
        3600000, 1500000, 1500000, '556677',
        'PENDING_RETURN', DATEADD(MONTH, -3, @TestDate), NULL, @PolicyVersionId, 0
    );

    DECLARE @CtrRt1Id BIGINT = SCOPE_IDENTITY();

    -- Tạo phiếu yêu cầu trả kho return_request phân công cho @StaffId
    INSERT INTO return_request (
        contract_id, requested_at, requested_return_date, appointment_slot,
        status, inspected_by, damage_cost, deposit_refund_amount
    )
    VALUES (
        @CtrRt1Id, DATEADD(DAY, -2, SYSDATETIMEOFFSET()), @TestDate, N'14:00 - 15:00',
        'PENDING', @StaffId, 0, 1500000
    );

    INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
    VALUES (@StaffId, @FacCgIdB1, @TestDate, 'RETURN', 'CONTRACT', @CtrRt1Id, @ManagerId);

    IF @RealDate <> @TestDate
    BEGIN
        INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
        VALUES (@StaffId, @FacCgIdB1, @RealDate, 'RETURN', 'CONTRACT', @CtrRt1Id, @ManagerId);
    END;
END;

-- B2. Return 2: Chờ nghiệm thu phòng (PENDING_RETURN) tại Quận 1 (Q1-B201, UT-LARGE)
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-STAFF-RT02')
BEGIN
    DECLARE @FacQ1IdB2 BIGINT = (SELECT id FROM facility WHERE code = 'FAC-Q1');
    DECLARE @SuQ1B201Id BIGINT = (SELECT id FROM storage_unit WHERE facility_id = @FacQ1IdB2 AND code = 'Q1-B201');
    IF @SuQ1B201Id IS NULL
        SET @SuQ1B201Id = (SELECT TOP 1 id FROM storage_unit WHERE facility_id = @FacQ1IdB2);

    DECLARE @UtLargeIdB2 BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-LARGE');

    UPDATE storage_unit SET status = 'OCCUPIED' WHERE id = @SuQ1B201Id;

    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    VALUES (
        'RSV-STAFF-RT02', @CustStorageId, @FacQ1IdB2, @UtLargeIdB2, @SuQ1B201Id,
        DATEADD(MONTH, -6, @TestDate), 6, @TestDate, 2500000,
        @PolicyVersionId, 2500000, 15000000, 17500000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    );

    DECLARE @RsvRt2Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, return_date, policy_version_id, overdue_fee_accrued
    )
    VALUES (
        'CTR-20261012-2022', @RsvRt2Id, @CustStorageId, @FacQ1IdB2, @SuQ1B201Id, @UtLargeIdB2,
        DATEADD(MONTH, -6, @TestDate), @TestDate, 6, 2500000,
        15000000, 2500000, 2500000, '334455',
        'PENDING_RETURN', DATEADD(MONTH, -6, @TestDate), NULL, @PolicyVersionId, 0
    );

    DECLARE @CtrRt2Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO return_request (
        contract_id, requested_at, requested_return_date, appointment_slot,
        status, inspected_by, damage_cost, deposit_refund_amount
    )
    VALUES (
        @CtrRt2Id, DATEADD(DAY, -1, SYSDATETIMEOFFSET()), @TestDate, N'16:30 - 17:30',
        'PENDING', @StaffId, 0, 2500000
    );

    INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
    VALUES (@StaffId, @FacQ1IdB2, @TestDate, 'RETURN', 'CONTRACT', @CtrRt2Id, @ManagerId);

    IF @RealDate <> @TestDate
    BEGIN
        INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
        VALUES (@StaffId, @FacQ1IdB2, @RealDate, 'RETURN', 'CONTRACT', @CtrRt2Id, @ManagerId);
    END;
END;

-- B3. Return 3: Đã hoàn tất nghiệm thu trong ca (INSPECTED) tại Cầu Giấy (CG-L301)
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservation WHERE code = 'RSV-STAFF-RT03')
BEGIN
    DECLARE @FacCgIdB3 BIGINT = (SELECT id FROM facility WHERE code = 'FAC-CG');
    DECLARE @SuCgL301Id BIGINT = (SELECT id FROM storage_unit WHERE facility_id = @FacCgIdB3 AND code = 'CG-L301');
    IF @SuCgL301Id IS NULL
        SET @SuCgL301Id = (SELECT TOP 1 id FROM storage_unit WHERE facility_id = @FacCgIdB3);

    DECLARE @UtLargeIdB3 BIGINT = (SELECT id FROM unit_type WHERE code = 'UT-LARGE');

    UPDATE storage_unit SET status = 'CLEANING' WHERE id = @SuCgL301Id;

    INSERT INTO reservation (
        code, customer_id, facility_id, unit_type_id, storage_unit_id,
        start_date, rental_months, end_date_exclusive, monthly_price_snapshot,
        policy_version_id, deposit_amount, total_rental_fee, total_payable,
        status, hold_expires_at, confirmed_at, fulfilled_at
    )
    VALUES (
        'RSV-STAFF-RT03', @CustNamId, @FacCgIdB3, @UtLargeIdB3, @SuCgL301Id,
        DATEADD(MONTH, -12, @TestDate), 12, @TestDate, 2500000,
        @PolicyVersionId, 2500000, 30000000, 32500000,
        'FULFILLED', DATEADD(HOUR, 48, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    );

    DECLARE @RsvRt3Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO rental_contract (
        code, reservation_id, customer_id, facility_id, storage_unit_id, unit_type_id,
        start_date, end_date, rental_months, monthly_price_snapshot,
        total_rental_fee, deposit_amount, deposit_balance, access_code,
        status, checkin_date, return_date, policy_version_id, overdue_fee_accrued
    )
    VALUES (
        'CTR-20261012-2033', @RsvRt3Id, @CustNamId, @FacCgIdB3, @SuCgL301Id, @UtLargeIdB3,
        DATEADD(MONTH, -12, @TestDate), @TestDate, 12, 2500000,
        30000000, 2500000, 2500000, '998811',
        'CLOSED', DATEADD(MONTH, -12, @TestDate), @TestDate, @PolicyVersionId, 0
    );

    DECLARE @CtrRt3Id BIGINT = SCOPE_IDENTITY();

    INSERT INTO return_request (
        contract_id, requested_at, requested_return_date, appointment_slot,
        status, inspected_by, inspected_at, is_intact, condition_note, damage_cost, deposit_refund_amount
    )
    VALUES (
        @CtrRt3Id, DATEADD(DAY, -3, SYSDATETIMEOFFSET()), @TestDate, N'10:00 - 11:00',
        'COMPLETED', @StaffId, SYSDATETIMEOFFSET(), 1, N'Mặt bằng sạch sẽ, khóa nguyên vẹn không trầy xước.', 0, 2500000
    );

    INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
    VALUES (@StaffId, @FacCgIdB3, @TestDate, 'INSPECTION', 'CONTRACT', @CtrRt3Id, @ManagerId);

    IF @RealDate <> @TestDate
    BEGIN
        INSERT INTO staff_daily_assignment (staff_id, facility_id, work_date, task_type, reference_type, reference_id, assigned_by)
        VALUES (@StaffId, @FacCgIdB3, @RealDate, 'INSPECTION', 'CONTRACT', @CtrRt3Id, @ManagerId);
    END;
END;

-- ============================================================================
-- C. INCIDENT & SUPPORT TASKS (SỰ CỐ KỸ THUẬT & THỰC ĐỊA)
-- ============================================================================

-- C1. Sự cố Mới (NEW): Kẹt khóa số điện tử (LOCK_ACCESS) tại Cầu Giấy
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20261012-1001')
BEGIN
    DECLARE @SuIdC1 BIGINT = (SELECT id FROM storage_unit WHERE code = 'CG-S103');
    DECLARE @CIdC1 BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20261012-1011');

    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, created_at, updated_at
    )
    VALUES (
        'SUP-20261012-1001', @CustStorageId, @CIdC1, @SuIdC1, 'LOCK_ACCESS',
        N'Bàn phím số điện tử nháy đèn đỏ không nhả chốt: Khách hàng nhập đúng mã PIN nhưng bàn phím số phát âm thanh cảnh báo và khóa cơ không mở. Cần nhân viên kỹ thuật ca trực mang chìa cơ dự phòng đến hỗ trợ mở thủ công và thay pin.',
        'NEW', @StaffId, DATEADD(HOUR, 2, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
    );
END;

-- C2. Sự cố Đang xử lý (IN_PROGRESS): Hư hỏng ray trượt cửa kho (UNIT_DAMAGE) tại Cầu Giấy
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20261012-1002')
BEGIN
    DECLARE @SuIdC2 BIGINT = (SELECT id FROM storage_unit WHERE code = 'CG-M202');
    DECLARE @CIdC2 BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20261012-2011');

    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, created_at, updated_at
    )
    VALUES (
        'SUP-20261012-1002', @CustNhiId, @CIdC2, @SuIdC2, 'UNIT_DAMAGE',
        N'Cửa cuốn kéo lên bị kẹt mép trái: Nhân viên đã kiểm tra hiện trường, phát hiện chốt ray dẫn hướng bị lệch. Đang tiến hành nắn ray bôi trơn bánh xe trượt để bàn giao khách hoàn tất.',
        'IN_PROGRESS', @StaffId, DATEADD(HOUR, 4, SYSDATETIMEOFFSET()), DATEADD(HOUR, -2, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET()
    );
END;

-- C3. Sự cố Đang xử lý - Cần di dời (IN_PROGRESS): Thấm ẩm cần đổi kho (UNIT_DAMAGE / relocation) tại Quận 1
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20261012-1003')
BEGIN
    DECLARE @SuIdC3 BIGINT = (SELECT id FROM storage_unit WHERE code = 'Q1-B201');
    IF @SuIdC3 IS NULL
        SET @SuIdC3 = (SELECT TOP 1 id FROM storage_unit WHERE facility_id = (SELECT id FROM facility WHERE code = 'FAC-Q1'));
    DECLARE @CIdC3 BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20261012-2022');

    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, relocation_required, customer_notice, created_at, updated_at
    )
    VALUES (
        'SUP-20261012-1003', @CustStorageId, @CIdC3, @SuIdC3, 'UNIT_DAMAGE',
        N'Vách ngăn ô kho có hiện tượng ngưng tụ nước: Cần nhân viên hỗ trợ khách kiểm tra an toàn hàng hóa và phối hợp Quản lý cơ sở sắp xếp thủ tục đổi sang ô kho khô ráo lân cận.',
        'IN_PROGRESS', @StaffId, DATEADD(HOUR, 6, SYSDATETIMEOFFSET()), 1,
        N'Đã liên hệ khách hàng và hướng dẫn chuẩn bị di dời đồ đạc sang kho thay thế.',
        DATEADD(HOUR, -1, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET()
    );
END;

-- C4. Sự cố Đã khắc phục (RESOLVED): Vệ sinh khử khuẩn bàn giao kho (OTHER) tại Cầu Giấy
IF @StaffId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20261012-1004')
BEGIN
    DECLARE @SuIdC4 BIGINT = (SELECT id FROM storage_unit WHERE code = 'CG-L301');
    DECLARE @CIdC4 BIGINT = (SELECT id FROM rental_contract WHERE code = 'CTR-20261012-2033');

    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, resolved_at, resolution_note, created_at, updated_at
    )
    VALUES (
        'SUP-20261012-1004', @CustNamId, @CIdC4, @SuIdC4, 'OTHER',
        N'Vệ sinh dọn dẹp sau khi khách dọn đồ trả kho: Đã hút bụi sàn kho, lau khử khuẩn bề mặt và niêm phong cửa kho sẵn sàng đón lượt thuê tiếp theo.',
        'RESOLVED', @StaffId, DATEADD(HOUR, -1, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET(),
        N'Nhân viên trực ca Trần Thị Nhân Viên đã hoàn tất vệ sinh công nghiệp 100%, tình trạng ô kho sạch sẽ thơm tho đạt chuẩn bàn giao.',
        DATEADD(DAY, -1, SYSDATETIMEOFFSET()), SYSDATETIMEOFFSET()
    );
END;
