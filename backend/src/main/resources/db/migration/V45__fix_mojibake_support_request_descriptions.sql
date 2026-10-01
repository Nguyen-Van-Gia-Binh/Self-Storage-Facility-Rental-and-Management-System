-- V45__fix_mojibake_support_request_descriptions.sql
-- Chuẩn hóa và sửa lỗi hiển thị tiếng Việt Unicode cho các phiếu sự cố demo

UPDATE support_request
SET description = N'Kẹt khóa điện tử tại ngăn kho Q7-A101: Khách hàng nhập mã số đúng nhưng chốt cơ khí không bung ra, cần nhân viên kỹ thuật trực ca đến kiểm tra và hỗ trợ mở khóa khẩn cấp.'
WHERE code = 'SUP-20260928-0010';

UPDATE support_request
SET description = N'[Tạo Là Nhi] Nhi hihi 123'
WHERE code = 'SUP-202609-0002';
