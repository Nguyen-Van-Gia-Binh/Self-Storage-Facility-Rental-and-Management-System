-- V50__normalize_active_policy_deposit_multiplier.sql
-- Đảm bảo deposit_multiplier tuân thủ BR-DEP-01 (1.0 = 1 tháng tiền thuê) cho toàn bộ phiên bản chính sách

UPDATE policy_version
SET deposit_multiplier = 1.0
WHERE deposit_multiplier > 2.0 OR deposit_multiplier IS NULL;
