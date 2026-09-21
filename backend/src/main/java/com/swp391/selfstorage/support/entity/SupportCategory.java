package com.swp391.selfstorage.support.entity;

/**
 * Danh mục sự cố / yêu cầu hỗ trợ (CK_SUPPORT_REQUEST_CATEGORY).
 */
public enum SupportCategory {
    UNIT_DAMAGE,    // Hư hại ô kho
    LOCK_ACCESS,    // Vấn đề khóa / mã PIN ra vào (SLA 2h khẩn cấp - BR-SUP-01)
    PAYMENT,        // Vấn đề thanh toán / tiền cọc / hóa đơn
    BELONGINGS,     // Vấn đề tài sản lưu trữ
    OTHER           // Vấn đề khác
}
