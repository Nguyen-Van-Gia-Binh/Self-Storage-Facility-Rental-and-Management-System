-- ==============================================================================
-- Migration V42: Bổ sung các trường nâng hạng đền bù miễn phí trên hợp đồng (BR-BMP-01)
-- ==============================================================================

ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS is_upgraded_compensation BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS original_unit_type_id BIGINT NULL;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS upgrade_reason TEXT NULL;
