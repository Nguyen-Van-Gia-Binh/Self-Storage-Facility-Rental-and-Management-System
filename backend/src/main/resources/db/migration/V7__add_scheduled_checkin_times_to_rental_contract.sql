ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS scheduled_start_time TIME NULL;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS scheduled_end_time TIME NULL;

