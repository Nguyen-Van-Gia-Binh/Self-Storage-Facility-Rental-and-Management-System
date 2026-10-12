-- V52: Mở rộng cột file_url của bảng attachment sang NVARCHAR(MAX) để lưu ảnh chụp trực tiếp từ Camera (Base64 Data URL)
ALTER TABLE attachment ALTER COLUMN file_url NVARCHAR(MAX) NOT NULL;
