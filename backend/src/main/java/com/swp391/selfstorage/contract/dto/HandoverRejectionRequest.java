package com.swp391.selfstorage.contract.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoverRejectionRequest {
    @NotBlank
    @JsonProperty("rejectionReason")
    private String rejectionReason;

    @JsonProperty("reportedDefects")
    private String reportedDefects;

    /**
     * Hành động khi phát hiện sự cố lúc bàn giao:
     * - RELOCATE (Mặc định): Khách đồng ý đổi sang ô khác -> Giữ PENDING_CHECK_IN, tạo SupportRequest, ô cũ MAINTENANCE
     * - TERMINATE_REFUND: Khách hủy & yêu cầu hoàn cọc -> Chuyển TERMINATED, ngày kết thúc = ngày check-in
     */
    @Builder.Default
    @JsonProperty("rejectionAction")
    private String rejectionAction = "RELOCATE";

    public String getRejectionAction() {
        if (rejectionAction != null && !rejectionAction.isBlank()) {
            return rejectionAction.trim().toUpperCase();
        }
        return "RELOCATE";
    }
}
