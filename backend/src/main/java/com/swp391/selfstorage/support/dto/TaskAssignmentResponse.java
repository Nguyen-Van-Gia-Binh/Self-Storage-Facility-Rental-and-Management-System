package com.swp391.selfstorage.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Kết quả phân công nhiệm vụ thực địa (FM-05)")
public class TaskAssignmentResponse {

    @Schema(description = "Cờ thành công", example = "true")
    private boolean success;

    @Schema(description = "Thông báo kết quả", example = "Phân công nhiệm vụ thành công cho nhân viên Trần Văn Hùng")
    private String message;

    @Schema(description = "ID nhiệm vụ", example = "1000501")
    private Long taskId;

    @Schema(description = "Loại nhiệm vụ", example = "CHECK_IN")
    private String taskType;

    @Schema(description = "ID nhân viên được phân công", example = "8")
    private Long assignedStaffId;

    @Schema(description = "Tên nhân viên được phân công", example = "Trần Văn Hùng")
    private String assignedStaffName;

    @Schema(description = "Trạng thái nhiệm vụ", example = "ASSIGNED")
    private String status;

    @Schema(description = "Thời điểm phân công")
    private OffsetDateTime assignedAt;
}
