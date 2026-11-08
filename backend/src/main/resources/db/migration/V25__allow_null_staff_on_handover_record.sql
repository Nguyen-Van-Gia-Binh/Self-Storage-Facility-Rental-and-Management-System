-- Cho phép staff_id NULL khi khách hàng tự Check-in online 24/7 (tự nhận kho thông minh không qua nhân viên lễ tân)
ALTER TABLE handover_record ALTER COLUMN staff_id DROP NOT NULL;

