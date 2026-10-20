-- V14__create_password_reset_otp_table.sql
-- Bảng lưu mã xác thực OTP phục vụ quy trình Quên mật khẩu và Đặt lại mật khẩu

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'password_reset_otp')
BEGIN
    CREATE TABLE password_reset_otp (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL,
        otp_code NVARCHAR(10) NOT NULL,
        expired_at DATETIME2 NOT NULL,
        is_used BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX ix_password_reset_otp_email ON password_reset_otp(email);
    CREATE INDEX ix_password_reset_otp_email_otp ON password_reset_otp(email, otp_code);
END
GO
