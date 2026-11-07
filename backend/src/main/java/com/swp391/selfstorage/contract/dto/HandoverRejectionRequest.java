package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HandoverRejectionRequest {
    @NotBlank
    private String rejectionReason;
    private String reportedDefects;

    /**
     * Hành động khi phát hiện sự cố lúc bàn giao:
     * - RELOCATE (Mặc định): Khách đồng ý đổi sang ô khác -> Giữ PENDING_CHECK_IN, tạo SupportRequest, ô cũ MAINTENANCE
     * - TERMINATE_REFUND: Khách hủy & yêu cầu hoàn cọc -> Chuyển TERMINATED, ngày kết thúc = ngày check-in
     */
    private String rejectionAction = "RELOCATE";
}
