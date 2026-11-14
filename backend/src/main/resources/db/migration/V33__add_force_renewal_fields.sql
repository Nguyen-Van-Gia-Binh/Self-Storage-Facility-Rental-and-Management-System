-- V31: Bổ sung trường Force Renewal (BR-REN-10) vào bảng contract_renewal
-- Phục vụ luồng Quản lý cơ sở (FM) duyệt gia hạn ngoại lệ sau mốc T-20 ngày tại quầy

ALTER TABLE contract_renewal ADD COLUMN IF NOT EXISTS late_admin_fee BIGINT NOT NULL DEFAULT 0;
ALTER TABLE contract_renewal ADD COLUMN IF NOT EXISTS is_force_renewal BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE contract_renewal ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NULL;
ALTER TABLE contract_renewal ADD COLUMN IF NOT EXISTS notes VARCHAR(500) NULL;
