-- ============================================================================
-- Script: cleanup_duplicate_surcharges.sql
-- Mục đích: Dọn dẹp phụ phí rác thử nghiệm và bản ghi trùng tên "Hư hại" (ID=4 trùng với ID=9)
-- Ngày tạo: 2026-10-12
-- ============================================================================

USE [SelfStorageDB];
GO

BEGIN TRANSACTION;

-- 1. Xóa các phiên bản lịch sử phụ phí rác và trùng lặp
DELETE FROM extra_fee_version
WHERE extra_fee_type_id IN (1, 2, 4);

-- 2. Xóa danh mục phụ phí rác và trùng lặp
DELETE FROM extra_fee_type
WHERE id IN (1, 2, 4);

COMMIT TRANSACTION;
GO

-- 3. Kiểm tra lại danh sách phụ phí còn lại
SELECT id, code, name, fee_type, amount, is_active, facility_id
FROM extra_fee_type
ORDER BY id;
GO
