-- ==============================================================================
-- Migration V14: Bổ sung theo dõi số lần dời ngày nhận kho hợp đồng (BR-RES-06)
-- ==============================================================================

ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS reschedule_count INT NOT NULL DEFAULT 0;
ALTER TABLE rental_contract ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP WITH TIME ZONE NULL;
