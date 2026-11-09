-- V26: Sync initial payment transactions for direct contracts created via BANK_TRANSFER
-- Allows existing direct contracts with BANK_TRANSFER to be paid online by customers

UPDATE payment_transaction
SET status = 'PENDING', provider_reference = 'DIRECT_CONTRACT_BANK_TRANSFER'
WHERE (provider_reference = 'DIRECT_CONTRACT_DESK' OR provider_reference = 'DIRECT_CONTRACT_DESK_CASH')
  AND payment_method = 'BANK_TRANSFER';
