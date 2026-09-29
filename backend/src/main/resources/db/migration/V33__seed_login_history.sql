/* ============================================================================
   Flyway Migration V33__seed_login_history.sql
   Seed dữ liệu lịch sử đăng nhập để demo tính năng Audit Log (SA-04, US-SA-04.1)
   ============================================================================ */

-- Xóa dữ liệu login_history cũ nếu có (để migration có thể chạy lại được)
DELETE FROM login_history;

-- Lấy user IDs từ các tài khoản demo
DECLARE @adminId BIGINT = (SELECT id FROM app_user WHERE email = 'admin@smartstorage.vn');
DECLARE @bomId BIGINT = (SELECT id FROM app_user WHERE email = 'nhi.bom@smartstorage.vn');
DECLARE @managerId BIGINT = (SELECT id FROM app_user WHERE email = 'nguyen.van.gia.binh@smartstorage.vn');
DECLARE @staffId BIGINT = (SELECT id FROM app_user WHERE email = 'tran.thi.nhan.vien@smartstorage.vn');
DECLARE @customerId BIGINT = (SELECT id FROM app_user WHERE email = 'nhi.customer@gmail.com');

-- Seed login history cho Admin
IF @adminId IS NOT NULL
BEGIN
    INSERT INTO login_history (user_id, email, logged_in_at, ip_address, user_agent, is_success, failure_reason)
    VALUES
    (@adminId, 'admin@smartstorage.vn', DATEADD(HOUR, -1, GETDATE()), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 1, NULL),
    (@adminId, 'admin@smartstorage.vn', DATEADD(DAY, -1, GETDATE()), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 1, NULL),
    (@adminId, 'admin@smartstorage.vn', DATEADD(DAY, -2, GETDATE()), '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 1, NULL);
END

-- Seed login history cho BOM
IF @bomId IS NOT NULL
BEGIN
    INSERT INTO login_history (user_id, email, logged_in_at, ip_address, user_agent, is_success, failure_reason)
    VALUES
    (@bomId, 'nhi.bom@smartstorage.vn', DATEADD(HOUR, -2, GETDATE()), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 1, NULL),
    (@bomId, 'nhi.bom@smartstorage.vn', DATEADD(DAY, -1, GETDATE()), '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 1, NULL);

    -- Demo đăng nhập thất bại (sai mật khẩu)
    INSERT INTO login_history (user_id, email, logged_in_at, ip_address, user_agent, is_success, failure_reason)
    VALUES
    (@bomId, 'nhi.bom@smartstorage.vn', DATEADD(HOUR, -3, GETDATE()), '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0', 0, N'Sai mật khẩu');
END

-- Seed login history cho Manager
IF @managerId IS NOT NULL
BEGIN
    INSERT INTO login_history (user_id, email, logged_in_at, ip_address, user_agent, is_success, failure_reason)
    VALUES
    (@managerId, 'nguyen.van.gia.binh@smartstorage.vn', DATEADD(HOUR, -1, GETDATE()), '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 1, NULL),
    (@managerId, 'nguyen.van.gia.binh@smartstorage.vn', DATEADD(HOUR, -5, GETDATE()), '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 1, NULL),
    (@managerId, 'nguyen.van.gia.binh@smartstorage.vn', DATEADD(DAY, -1, GETDATE()), '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 1, NULL);

    -- Demo đăng nhập thất bại
    INSERT INTO login_history (user_id, email, logged_in_at, ip_address, user_agent, is_success, failure_reason)
    VALUES
    (@managerId, 'nguyen.van.gia.binh@smartstorage.vn', DATEADD(HOUR, -6, GETDATE()), '203.0.113.45', 'curl/7.68.0', 0, N'Sai mật khẩu');
END

-- Seed login history cho Staff
IF @staffId IS NOT NULL
BEGIN
    INSERT INTO login_history (user_id, email, logged_in_at, ip_address, user_agent, is_success, failure_reason)
    VALUES
    (@staffId, 'tran.thi.nhan.vien@smartstorage.vn', DATEADD(HOUR, -1, GETDATE()), '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Safari/605.1.15', 1, NULL),
    (@staffId, 'tran.thi.nhan.vien@smartstorage.vn', DATEADD(DAY, -1, GETDATE()), '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) Safari/605.1.15', 1, NULL);
END

-- Seed login history cho Customer
IF @customerId IS NOT NULL
BEGIN
    INSERT INTO login_history (user_id, email, logged_in_at, ip_address, user_agent, is_success, failure_reason)
    VALUES
    (@customerId, 'nhi.customer@gmail.com', DATEADD(HOUR, -2, GETDATE()), '192.168.1.104', 'Mozilla/5.0 (Android 14; Mobile) Chrome/120.0.0.0', 1, NULL),
    (@customerId, 'nhi.customer@gmail.com', DATEADD(DAY, -1, GETDATE()), '192.168.1.104', 'Mozilla/5.0 (Android 14; Mobile) Chrome/120.0.0.0', 1, NULL),
    (@customerId, 'nhi.customer@gmail.com', DATEADD(DAY, -3, GETDATE()), '192.168.1.104', 'Mozilla/5.0 (Android 14; Mobile) Chrome/120.0.0.0', 1, NULL);

    -- Demo đăng nhập thất bại (tài khoản không tồn tại)
    INSERT INTO login_history (user_id, email, logged_in_at, ip_address, user_agent, is_success, failure_reason)
    VALUES
    (NULL, 'hacker@evil.com', DATEADD(HOUR, -4, GETDATE()), '198.51.100.1', 'python-requests/2.28.0', 0, N'Email không tồn tại'),
    (NULL, 'fake@scam.net', DATEADD(HOUR, -12, GETDATE()), '203.0.113.50', 'python-requests/2.28.0', 0, N'Email không tồn tại');
END
