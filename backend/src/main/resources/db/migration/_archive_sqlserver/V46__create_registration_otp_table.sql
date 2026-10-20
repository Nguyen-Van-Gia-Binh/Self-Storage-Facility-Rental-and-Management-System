-- V46__create_registration_otp_table.sql
-- Bảng lưu mã xác thực OTP phục vụ quy trình Đăng ký tài khoản khách hàng mới (hiệu lực 5 phút)

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'registration_otp')
BEGIN
    CREATE TABLE registration_otp (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL,
        otp_code NVARCHAR(10) NOT NULL,
        expired_at DATETIME2 NOT NULL,
        is_used BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX ix_registration_otp_email ON registration_otp(email);
    CREATE INDEX ix_registration_otp_email_otp ON registration_otp(email, otp_code);
END
GO
