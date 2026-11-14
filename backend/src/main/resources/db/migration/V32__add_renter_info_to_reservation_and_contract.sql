-- ==============================================================================
-- Migration V32: Bổ sung thông tin người thuê ô kho riêng biệt trên Reservation & RentalContract
-- Tách biệt hoàn toàn với tên tài khoản đăng nhập (app_user.full_name)
-- ==============================================================================

ALTER TABLE reservation ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) NULL;
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) NULL;
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) NULL;
ALTER TABLE reservation ADD COLUMN IF NOT EXISTS customer_identity_number VARCHAR(20) NULL;

ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150) NULL;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20) NULL;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255) NULL;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS customer_identity_number VARCHAR(20) NULL;
