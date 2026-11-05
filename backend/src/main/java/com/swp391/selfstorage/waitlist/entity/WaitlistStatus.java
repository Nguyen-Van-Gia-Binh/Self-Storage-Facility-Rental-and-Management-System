package com.swp391.selfstorage.waitlist.entity;

/**
 * Trạng thái của đơn chờ trong phễu Telesales CRM (Flow 1, BR-WAT-*).
 */
public enum WaitlistStatus {
    /** Đang trong hàng đợi chờ xử lý theo FIFO */
    WAITING,

    /** FM đang thực hiện cuộc gọi tư vấn (khóa độc quyền tối đa 2 giờ) */
    CONTACTING,

    /** Khách hẹn gọi lại sau hoặc cần chăm sóc thêm */
    PENDING_FOLLOW_UP,

    /** Đã chốt thuê và chuyển đổi thành đơn đặt cọc Reservation (24h) */
    CONVERTED,

    /** Khách từ chối thuê hoặc không còn nhu cầu */
    REJECTED,

    /** Quá hạn ngày mong muốn targetStartDate mà không có kho */
    EXPIRED,

    /** Khách hàng chủ động hủy yêu cầu chờ */
    CANCELLED
}
