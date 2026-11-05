-- V13__add_waitlist_contact_phone.sql
-- Bổ sung trường số điện thoại liên hệ trực tiếp cho đơn đăng ký Waitlist (Flow 1, BR-WAT-*)

ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20) NULL;

