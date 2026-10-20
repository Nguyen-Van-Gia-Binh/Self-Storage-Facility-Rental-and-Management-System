/* ============================================================================
   Flyway Migration V15__seed_rich_facility_data.sql
   Cập nhật dữ liệu chi tiết cho cơ sở hiện có và bổ sung thêm 6 cơ sở mới (Tổng cộng 8 cơ sở toàn quốc)
   Thiết lập đầy đủ bảng giá theo từng loại kho cho từng cơ sở (BM-01, SC-01)
   ============================================================================ */

-- 1. Cap nhat thong tin chi tiet cho Co so Cau Giay (FAC-CG)
UPDATE facility
SET phone = '024-3795-8888',
    description = N'Cơ sở trung tâm công nghệ Cầu Giấy, tiếp cận thuận tiện từ đường Duy Tân và Phạm Hùng. Hệ thống giám sát an ninh camera AI 24/7, kiểm soát ra vào mã PIN tự động và hệ thống PCCC tiêu chuẩn.',
    opening_hours = N'06:00–22:00',
    status = 'ACTIVE',
    updated_at = SYSDATETIMEOFFSET()
WHERE code = 'FAC-CG';

-- 2. Cap nhat thong tin chi tiet cho Co so Quan 7 (FAC-Q7)
UPDATE facility
SET phone = '028-3775-9999',
    description = N'Cơ sở hiện đại tại Nam Sài Gòn, tích hợp hệ thống ô kho kiểm soát độ ẩm, điều hòa nhiệt độ tiêu chuẩn (Climate-Controlled), bãi đỗ xe tải bốc dỡ hàng hóa rộng rãi và bảo vệ trực 24/7.',
    opening_hours = N'00:00–24:00 (24/7)',
    status = 'ACTIVE',
    updated_at = SYSDATETIMEOFFSET()
WHERE code = 'FAC-Q7';

-- 3. Bo sung Co so Hai Ba Trung - Ha Noi (FAC-HBT)
IF NOT EXISTS (SELECT 1 FROM facility WHERE code = 'FAC-HBT')
BEGIN
    INSERT INTO facility (code, name, address, phone, description, opening_hours, status, created_at, updated_at)
    VALUES (
        'FAC-HBT',
        N'Cơ sở Hai Bà Trưng - Hà Nội',
        N'Số 125 Phố Huế, Phường Ngô Thì Nhậm, Quận Hai Bà Trưng, Hà Nội',
        '024-3976-1122',
        N'Cơ sở nằm tại trung tâm thương mại sầm uất phía Nam thủ đô. Rất thuận tiện lưu trữ tài liệu chứng từ kế toán, hồ sơ công ty và đồ dùng cá nhân chất lượng cao.',
        N'07:00–21:00',
        'ACTIVE',
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET()
    );
END

-- 4. Bo sung Co so Thanh Xuan - Ha Noi (FAC-TX)
IF NOT EXISTS (SELECT 1 FROM facility WHERE code = 'FAC-TX')
BEGIN
    INSERT INTO facility (code, name, address, phone, description, opening_hours, status, created_at, updated_at)
    VALUES (
        'FAC-TX',
        N'Cơ sở Thanh Xuân - Hà Nội',
        N'Số 36 Hoàng Cầu, Đống Đa, Hà Nội (Khu vực giáp ranh Thanh Xuân)',
        '024-3853-4455',
        N'Cơ sở đa năng phục vụ cư dân và hộ kinh doanh online trục đường vành đai và tàu điện trên cao Cát Linh - Hà Đông. Thang hàng tải trọng lớn, camera giám sát từng góc hành lang.',
        N'06:00–22:00',
        'ACTIVE',
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET()
    );
END

-- 5. Bo sung Co so Quan 1 - TP.HCM (FAC-Q1)
IF NOT EXISTS (SELECT 1 FROM facility WHERE code = 'FAC-Q1')
BEGIN
    INSERT INTO facility (code, name, address, phone, description, opening_hours, status, created_at, updated_at)
    VALUES (
        'FAC-Q1',
        N'Cơ sở Quận 1 - TP.HCM',
        N'Số 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
        '028-3822-8899',
        N'Cơ sở chuẩn dịch vụ cao cấp ngay lõi trung tâm tài chính thành phố. Ra vào tự động hoàn toàn bằng mã PIN Smart Storage, hệ thống bảo hiểm tài sản toàn diện theo tiêu chuẩn quốc tế.',
        N'06:00–22:00',
        'ACTIVE',
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET()
    );
END

-- 6. Bo sung Co so Binh Thanh - TP.HCM (FAC-BT)
IF NOT EXISTS (SELECT 1 FROM facility WHERE code = 'FAC-BT')
BEGIN
    INSERT INTO facility (code, name, address, phone, description, opening_hours, status, created_at, updated_at)
    VALUES (
        'FAC-BT',
        N'Cơ sở Bình Thạnh - TP.HCM',
        N'Số 789 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
        '028-3512-6688',
        N'Cơ sở cửa ngõ phía Đông thành phố, ngay chân cầu Sài Gòn. Trang bị thang tải hàng chuyên dụng tải trọng 2 tấn, khu vực bốc dỡ có mái che chống mưa gió.',
        N'07:00–21:00',
        'ACTIVE',
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET()
    );
END

-- 7. Bo sung Co so TP. Thu Duc - TP.HCM (FAC-TD)
IF NOT EXISTS (SELECT 1 FROM facility WHERE code = 'FAC-TD')
BEGIN
    INSERT INTO facility (code, name, address, phone, description, opening_hours, status, created_at, updated_at)
    VALUES (
        'FAC-TD',
        N'Cơ sở TP. Thủ Đức - TP.HCM',
        N'Số 215 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM',
        '028-3896-1234',
        N'Cơ sở phục vụ khu đô thị sáng tạo Thủ Đức, khu công nghệ cao và làng đại học. Nhiều kích thước kho mini tiện lợi cho sinh viên và gia đình lưu trữ đồ dùng chuyển nhà.',
        N'06:00–22:00',
        'ACTIVE',
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET()
    );
END

-- 8. Bo sung Co so Hai Chau - Da Nang (FAC-HC)
IF NOT EXISTS (SELECT 1 FROM facility WHERE code = 'FAC-HC')
BEGIN
    INSERT INTO facility (code, name, address, phone, description, opening_hours, status, created_at, updated_at)
    VALUES (
        'FAC-HC',
        N'Cơ sở Hải Châu - Đà Nẵng',
        N'Số 88 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
        '0236-365-7788',
        N'Cơ sở đầu tiên tại thành phố đáng sống Đà Nẵng, tọa lạc trên trục đường tài chính huyết mạch dẫn thẳng ra Sân bay Quốc tế. Bảo quản tối ưu chống ẩm gió biển miền Trung.',
        N'06:00–22:00',
        'ACTIVE',
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET()
    );
END

-- ============================================================================
-- THIET LAP KHUNG GIA (FACILITY_UNIT_TYPE_PRICE) CHO 6 CO SO MOI
-- (Moi co so duoc gan du 4 loai kho UT-SMALL, UT-MEDIUM, UT-LARGE, UT-CLIMATE)
-- ============================================================================

-- Bảng giá FAC-HBT (Hai Bà Trưng)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 530000 FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-SMALL'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 1250000 FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-MEDIUM'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2600000 FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-LARGE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 3150000 FROM facility f, unit_type ut WHERE f.code = 'FAC-HBT' AND ut.code = 'UT-CLIMATE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);

-- Bảng giá FAC-TX (Thanh Xuân)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 480000 FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-SMALL'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 1150000 FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-MEDIUM'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2400000 FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-LARGE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2950000 FROM facility f, unit_type ut WHERE f.code = 'FAC-TX' AND ut.code = 'UT-CLIMATE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);

-- Bảng giá FAC-Q1 (Quận 1)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 650000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-SMALL'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 1450000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-MEDIUM'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2900000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-LARGE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 3500000 FROM facility f, unit_type ut WHERE f.code = 'FAC-Q1' AND ut.code = 'UT-CLIMATE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);

-- Bảng giá FAC-BT (Bình Thạnh)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 520000 FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-SMALL'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 1250000 FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-MEDIUM'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2550000 FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-LARGE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 3100000 FROM facility f, unit_type ut WHERE f.code = 'FAC-BT' AND ut.code = 'UT-CLIMATE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);

-- Bảng giá FAC-TD (Thủ Đức)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 490000 FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-SMALL'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 1150000 FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-MEDIUM'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2400000 FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-LARGE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2900000 FROM facility f, unit_type ut WHERE f.code = 'FAC-TD' AND ut.code = 'UT-CLIMATE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);

-- Bảng giá FAC-HC (Hải Châu - Đà Nẵng)
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 450000 FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-SMALL'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 1050000 FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-MEDIUM'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2200000 FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-LARGE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
INSERT INTO facility_unit_type_price (facility_id, unit_type_id, monthly_price)
SELECT f.id, ut.id, 2800000 FROM facility f, unit_type ut WHERE f.code = 'FAC-HC' AND ut.code = 'UT-CLIMATE'
  AND NOT EXISTS (SELECT 1 FROM facility_unit_type_price x WHERE x.facility_id = f.id AND x.unit_type_id = ut.id);
