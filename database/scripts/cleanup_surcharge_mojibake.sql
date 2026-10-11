-- ============================================================================
-- Script: cleanup_surcharge_mojibake.sql
-- Mục đích: Chuẩn hóa tên phụ phí #3 bị lỗi font UTF-8 Mojibake (Cáº¥p láº¡i -> Cấp lại khóa cơ)
-- Ngày tạo: 2026-10-12
-- ============================================================================

USE [SelfStorageDB];
GO

BEGIN TRANSACTION;

-- 1. Cập nhật bảng extra_fee_type
UPDATE extra_fee_type
SET name = N'Cấp lại khóa cơ'
WHERE id = 3;

-- 2. Cập nhật bảng lịch sử extra_fee_version
UPDATE extra_fee_version
SET name = N'Cấp lại khóa cơ'
WHERE extra_fee_type_id = 3;

COMMIT TRANSACTION;
GO

-- Kiểm tra lại kết quả
SELECT id, code, name, is_active, amount 
FROM extra_fee_type 
WHERE id = 3;

SELECT id, extra_fee_type_id, name, is_active, effective_from, created_at 
FROM extra_fee_version 
WHERE extra_fee_type_id = 3
ORDER BY created_at DESC;
GO
