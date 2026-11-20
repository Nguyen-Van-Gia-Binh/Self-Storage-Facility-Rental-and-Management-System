-- ==============================================================================
-- Migration V47: Dọn dẹp dữ liệu giao dịch hoàn tiền dị thường của hợp đồng test #9047
-- ==============================================================================

-- 1. Xóa các giao dịch thanh toán dị thường (3,6 tỷ đồng hoàn tiền ảo) của hợp đồng test 9047
DELETE FROM payment_transaction WHERE contract_id = 9047 OR reservation_id = 9047;

-- 2. Xóa biên bản trả kho liên quan đến hợp đồng test 9047
DELETE FROM return_request WHERE contract_id = 9047;

-- 3. Xóa hợp đồng và đơn đặt chỗ test 9047
DELETE FROM rental_contract WHERE id = 9047;
DELETE FROM reservation WHERE id = 9047;
