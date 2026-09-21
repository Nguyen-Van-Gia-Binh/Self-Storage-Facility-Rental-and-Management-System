package com.swp391.selfstorage.support.entity;

/**
 * Loại nhiệm vụ phân công hằng ngày cho nhân viên cơ sở (bảng staff_daily_assignment).
 * Khớp với CHECK constraint: ('HANDOVER','RETURN','SUPPORT','INSPECTION')
 */
public enum AssignmentTaskType {
    HANDOVER,
    RETURN,
    SUPPORT,
    INSPECTION
}
