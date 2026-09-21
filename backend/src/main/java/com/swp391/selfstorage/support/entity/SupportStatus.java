package com.swp391.selfstorage.support.entity;

/**
 * Trạng thái yêu cầu hỗ trợ (CK_SUPPORT_REQUEST_STATUS).
 */
public enum SupportStatus {
    NEW,            // Khách vừa gửi yêu cầu, chưa tiếp nhận
    ASSIGNED,       // Đã phân công nhân viên kỹ thuật xử lý (FM-05)
    IN_PROGRESS,    // Nhân viên đang xử lý hoặc khách phản hồi cần xử lý lại (FS-05)
    RESOLVED,       // Nhân viên đã báo hoàn tất, chờ khách xác nhận (BR-SUP-03)
    CLOSED,         // Khách đã xác nhận hài lòng, đóng ticket (SC-06.3)
    AUTO_CLOSED     // Tự động đóng sau thời gian khách không phản hồi (BR-SUP-03)
}
