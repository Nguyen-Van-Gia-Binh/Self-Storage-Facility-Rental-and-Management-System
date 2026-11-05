-- ============================================================================
-- V11__sync_pending_checkin_reservation_status.sql
-- Đồng bộ trạng thái đơn đặt chỗ cho các hợp đồng đang ở trạng thái PENDING_CHECK_IN:
-- Khi hợp đồng chưa hoàn tất nhận kho (PENDING_CHECK_IN), reservation phải ở trạng thái CONFIRMED
-- để khách hàng có thể thực hiện quyền hủy nhận kho và hoàn tiền theo BR-CAN-01 / BR-RES-04.
-- ============================================================================

UPDATE reservation r
SET status = 'CONFIRMED',
    fulfilled_at = NULL,
    updated_at = CURRENT_TIMESTAMP
FROM rental_contract rc
WHERE rc.reservation_id = r.id
  AND rc.status = 'PENDING_CHECK_IN'
  AND r.status = 'FULFILLED';
