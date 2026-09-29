/* ============================================================================
   Flyway Migration V33__normalize_unit_type_names_and_seed_terms.sql
   1. Chuẩn hóa tên loại ô kho trong unit_type: loại bỏ chữ 'Locker'
   2. Chuẩn hóa các ghi chú dữ liệu mẫu trong return_request và support_request
   ============================================================================ */

-- 1. Chuan hoa ten Unit Types (Loai bo chu 'Locker' va 'Tu do')
UPDATE unit_type SET name = N'Kho Nhỏ (Small Unit)' WHERE code = 'UT-SMALL';
UPDATE unit_type SET name = N'Kho Vừa (Medium Unit)' WHERE code = 'UT-MEDIUM';
UPDATE unit_type SET name = N'Kho Lớn (Large Unit)' WHERE code = 'UT-LARGE';
UPDATE unit_type SET name = N'Kho Lạnh (Climate Unit)' WHERE code = 'UT-CLIMATE';
GO

-- 2. Chuan hoa cac ghi chu mau chua tu ngu 'ngan tu' hoac 'ngan kho'
IF OBJECT_ID('return_request', 'U') IS NOT NULL
BEGIN
    UPDATE return_request
    SET condition_note = REPLACE(condition_note, N'ngăn tủ', N'ô kho')
    WHERE condition_note LIKE N'%ngăn tủ%';

    UPDATE return_request
    SET condition_note = REPLACE(condition_note, N'ngăn kho', N'ô kho')
    WHERE condition_note LIKE N'%ngăn kho%';
END
GO

IF OBJECT_ID('support_request', 'U') IS NOT NULL
BEGIN
    UPDATE support_request
    SET description = REPLACE(description, N'ngăn tủ', N'ô kho')
    WHERE description LIKE N'%ngăn tủ%';

    UPDATE support_request
    SET description = REPLACE(description, N'ngăn kho', N'ô kho')
    WHERE description LIKE N'%ngăn kho%';
END
GO

-- 3. Dong bo tham so chinh sach cancel_late_refund_rate = 0.0 theo BR-CAN-02
IF OBJECT_ID('policy_version', 'U') IS NOT NULL
BEGIN
    UPDATE policy_version
    SET cancel_late_refund_rate = 0.0
    WHERE cancel_late_refund_rate = 0.5;
END
GO
