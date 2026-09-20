package com.swp391.selfstorage.reservation.entity;

/**
 * 6 Trạng thái vòng đời của đơn đặt chỗ theo state-machine-reservation và V1__init_schema.sql
 */
public enum ReservationStatus {
    PENDING_PAYMENT, // Khách vừa đặt chỗ, tạm giữ ô kho 48h (BR-RES-02, BR-DEP-03)
    CONFIRMED,       // Đã thanh toán VietQR thành công, khóa chính thức ô kho (BR-AVL-04)
    FULFILLED,       // Đã hoàn tất Check-in & Nghiệm thu nhận kho tại quầy (BR-RES-05)
    EXPIRED,         // Quá hạn 48h không thanh toán, giải phóng capacity (BR-DEP-03)
    CANCELLED,       // Khách hàng chủ động hủy trước khi Check-in (BR-CAN-01..08)
    NO_SHOW          // Quá 10 ngày ân hạn kể từ ngày bắt đầu mà không đến nhận kho (BR-CAN-04)
}
