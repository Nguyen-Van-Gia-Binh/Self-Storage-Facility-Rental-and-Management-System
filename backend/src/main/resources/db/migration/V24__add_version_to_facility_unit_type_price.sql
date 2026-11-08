-- V21: Add optimistic locking version column to facility_unit_type_price (CON-01)
ALTER TABLE facility_unit_type_price
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

