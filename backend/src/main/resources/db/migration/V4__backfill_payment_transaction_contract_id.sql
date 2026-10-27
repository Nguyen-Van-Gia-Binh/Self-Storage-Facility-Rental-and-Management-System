-- V4__backfill_payment_transaction_contract_id.sql
-- Dong bo lai contract_id cho cac ban ghi payment_transaction phat sinh tu reservation

UPDATE payment_transaction pt
SET contract_id = rc.id
FROM rental_contract rc
WHERE pt.reservation_id IS NOT NULL
  AND pt.contract_id IS NULL
  AND rc.reservation_id = pt.reservation_id;

