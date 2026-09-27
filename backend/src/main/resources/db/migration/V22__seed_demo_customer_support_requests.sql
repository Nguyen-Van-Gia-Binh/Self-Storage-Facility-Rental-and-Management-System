/* ============================================================================
   Flyway Migration V22__seed_demo_customer_support_requests.sql
   [GHI CHÚ QUAN TRỌNG: MỤC ĐÍCH KIỂM THỬ & DEMO (TEST ONLY)]
   Bổ sung 4 vé yêu cầu hỗ trợ sự cố hợp lệ (Support Requests) vào CSDL thật
   cho khách hàng Nguyễn Phạm Xuân Nhi (nhi.customer@gmail.com).
   Bao phủ 4 trạng thái vòng đời theo BR-SUP-01..03 (NEW, IN_PROGRESS, RESOLVED, CLOSED)
   và gắn trực tiếp với các hợp đồng/ô kho thực tế đã có trong hệ thống.
   ============================================================================ */

-- 1. Tìm Customer ID và Staff ID
DECLARE @CustId BIGINT = (SELECT id FROM app_user WHERE email = 'nhi.customer@gmail.com');
DECLARE @StaffId BIGINT = (SELECT TOP 1 id FROM app_user WHERE role = 'FACILITY_STAFF' AND status = 'ACTIVE' ORDER BY id ASC);

-- 2. Tìm ID hợp đồng và ô kho của khách hàng
DECLARE @C1_Id BIGINT = (SELECT id FROM rental_contract WHERE code IN ('CTR-20260801-7182', 'CTR-NHI-001'));
DECLARE @U1_Id BIGINT = (SELECT storage_unit_id FROM rental_contract WHERE id = @C1_Id);

DECLARE @C2_Id BIGINT = (SELECT id FROM rental_contract WHERE code IN ('CTR-20260901-3814', 'CTR-NHI-002'));
DECLARE @U2_Id BIGINT = (SELECT storage_unit_id FROM rental_contract WHERE id = @C2_Id);

DECLARE @C3_Id BIGINT = (SELECT id FROM rental_contract WHERE code IN ('CTR-20260915-5291', 'CTR-NHI-003'));
DECLARE @U3_Id BIGINT = (SELECT storage_unit_id FROM rental_contract WHERE id = @C3_Id);

DECLARE @C4_Id BIGINT = (SELECT id FROM rental_contract WHERE code IN ('CTR-20260601-9403', 'CTR-NHI-004'));
DECLARE @U4_Id BIGINT = (SELECT storage_unit_id FROM rental_contract WHERE id = @C4_Id);

-- ============================================================================
-- VÉ 1 (NEW - Mới gửi, Chờ tiếp nhận): Khóa & Truy cập (SLA 2 giờ - BR-SUP-01)
-- ============================================================================
IF @CustId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20260928-0001')
BEGIN
    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, created_at, updated_at
    )
    VALUES (
        'SUP-20260928-0001',
        @CustId,
        @C1_Id,
        @U1_Id,
        'LOCK_ACCESS',
        N'Mã PIN không mở được cửa tủ: Tôi nhập đúng mã PIN 123456 nhưng bàn phím số nhấp nháy đèn đỏ 3 lần và không nhả chốt khóa điện tử. Nhờ nhân viên trực hỗ trợ kiểm tra nguồn pin hoặc cấp mã mở dự phòng.',
        'NEW',
        NULL,
        DATEADD(MINUTE, 90, SYSDATETIMEOFFSET()),
        DATEADD(MINUTE, -30, SYSDATETIMEOFFSET()),
        DATEADD(MINUTE, -30, SYSDATETIMEOFFSET())
    );

    DECLARE @Ticket1Id BIGINT = SCOPE_IDENTITY();
    INSERT INTO attachment (entity_type, entity_id, file_url, uploaded_by, created_at)
    VALUES ('SUPPORT_REQUEST', @Ticket1Id, 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80', @CustId, DATEADD(MINUTE, -30, SYSDATETIMEOFFSET()));
END;

-- ============================================================================
-- VÉ 2 (IN_PROGRESS - Đang xử lý): Hư hỏng kho & Hạ tầng (Cơ sở Cầu Giấy)
-- ============================================================================
IF @CustId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20260928-0002')
BEGIN
    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, created_at, updated_at
    )
    VALUES (
        'SUP-20260928-0002',
        @CustId,
        @C2_Id,
        @U2_Id,
        'UNIT_DAMAGE',
        N'Bản lề cánh cửa tủ bị kẹt rít: Cửa tủ ngăn S101 bị kẹt mép dưới và phát ra tiếng kêu lớn khi đóng mở, cần kỹ thuật tra dầu bôi trơn và cân chỉnh lại gioăng an toàn.',
        'IN_PROGRESS',
        @StaffId,
        DATEADD(HOUR, 20, SYSDATETIMEOFFSET()),
        DATEADD(HOUR, -4, SYSDATETIMEOFFSET()),
        DATEADD(HOUR, -2, SYSDATETIMEOFFSET())
    );
END;

-- ============================================================================
-- VÉ 3 (RESOLVED - Đã xử lý xong, Chờ nghiệm thu đóng vé): Thanh toán & Nợ phạt
-- ============================================================================
IF @CustId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20260926-0003')
BEGIN
    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, resolved_at, resolution_note, created_at, updated_at
    )
    VALUES (
        'SUP-20260926-0003',
        @CustId,
        @C4_Id,
        @U4_Id,
        'PAYMENT',
        N'Yêu cầu kiểm tra đối soát phí phạt quá hạn: Tôi đã chuyển khoản đóng nợ phạt phí quá hạn nhưng hệ thống chưa tự động giải trừ phong tỏa mở tủ. Đã đính kèm ảnh chụp biên lai giao dịch.',
        'RESOLVED',
        @StaffId,
        DATEADD(HOUR, -10, SYSDATETIMEOFFSET()),
        DATEADD(HOUR, -2, SYSDATETIMEOFFSET()),
        N'Nhân viên kế toán cơ sở đã đối soát giao dịch ngân hàng thành công, cập nhật số dư tiền cọc và kích hoạt lại quyền ra vào mở khóa cho khách hàng.',
        DATEADD(DAY, -1, SYSDATETIMEOFFSET()),
        DATEADD(HOUR, -2, SYSDATETIMEOFFSET())
    );

    DECLARE @Ticket3Id BIGINT = SCOPE_IDENTITY();
    INSERT INTO attachment (entity_type, entity_id, file_url, uploaded_by, created_at)
    VALUES ('SUPPORT_REQUEST', @Ticket3Id, 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80', @CustId, DATEADD(DAY, -1, SYSDATETIMEOFFSET()));
END;

-- ============================================================================
-- VÉ 4 (CLOSED - Đã hoàn tất & Nghiệm thu): Tài sản & Tiện ích (Cơ sở Hải Châu)
-- ============================================================================
IF @CustId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM support_request WHERE code = 'SUP-20260920-0004')
BEGIN
    INSERT INTO support_request (
        code, customer_id, contract_id, storage_unit_id, category, description,
        status, assigned_staff_id, sla_due_at, resolved_at, resolution_note, customer_confirmed_at, created_at, updated_at
    )
    VALUES (
        'SUP-20260920-0004',
        @CustId,
        @C3_Id,
        @U3_Id,
        'BELONGINGS',
        N'Mượn xe đẩy hàng và thang chữ A: Cần hỗ trợ mượn 01 xe đẩy bánh cao su và thang nhôm 4 bậc tại sảnh tầng 2 để chuyển kiện hàng nặng vào kho.',
        'CLOSED',
        @StaffId,
        DATEADD(DAY, -7, SYSDATETIMEOFFSET()),
        DATEADD(DAY, -7, SYSDATETIMEOFFSET()),
        N'Đã bàn giao xe đẩy hàng và thang nhôm cho khách tại sảnh Tầng 2. Khách hàng đã hoàn trả đầy đủ thiết bị lúc 16:30.',
        DATEADD(DAY, -6, SYSDATETIMEOFFSET()),
        DATEADD(DAY, -8, SYSDATETIMEOFFSET()),
        DATEADD(DAY, -6, SYSDATETIMEOFFSET())
    );
END;
