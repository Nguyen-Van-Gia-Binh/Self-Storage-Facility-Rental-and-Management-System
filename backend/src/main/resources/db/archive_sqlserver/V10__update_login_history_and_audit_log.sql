-- V10__update_login_history_and_audit_log.sql
-- Cập nhật bảng login_history và audit_log phục vụ theo dõi nhật ký (SA-04, US-SA-04.1, US-SA-04.2, ISS-30)

-- 1. Cho phép user_id trong login_history nhận giá trị NULL (trường hợp đăng nhập sai bằng email không tồn tại)
IF EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('login_history') 
      AND name = 'user_id' 
      AND is_nullable = 0
)
BEGIN
    ALTER TABLE login_history ALTER COLUMN user_id BIGINT NULL;
END
GO

-- 2. Bổ sung cột email và failure_reason vào login_history nếu chưa có
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('login_history') 
      AND name = 'email'
)
BEGIN
    ALTER TABLE login_history ADD email NVARCHAR(255) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('login_history') 
      AND name = 'failure_reason'
)
BEGIN
    ALTER TABLE login_history ADD failure_reason NVARCHAR(255) NULL;
END
GO

-- 3. Tạo index phục vụ tìm kiếm nhanh cho login_history và audit_log
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_login_history_email' AND object_id = OBJECT_ID('login_history'))
BEGIN
    CREATE INDEX ix_login_history_email ON login_history(email);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_login_history_logged_in_at' AND object_id = OBJECT_ID('login_history'))
BEGIN
    CREATE INDEX ix_login_history_logged_in_at ON login_history(logged_in_at);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_audit_log_created_at' AND object_id = OBJECT_ID('audit_log'))
BEGIN
    CREATE INDEX ix_audit_log_created_at ON audit_log(created_at);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_audit_log_action' AND object_id = OBJECT_ID('audit_log'))
BEGIN
    CREATE INDEX ix_audit_log_action ON audit_log(action);
END
GO
