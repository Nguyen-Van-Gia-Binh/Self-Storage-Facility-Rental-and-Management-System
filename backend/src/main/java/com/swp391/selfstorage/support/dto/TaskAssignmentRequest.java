package com.swp391.selfstorage.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu phân công nhiệm vụ thực địa cho nhân viên cơ sở (FM-05, US-FM-05.1)")
public class TaskAssignmentRequest {

    @Schema(description = "ID nhiệm vụ từ bàn điều phối", example = "1000501")
    private Long taskId;

    @Schema(description = "ID hợp đồng nếu là nhiệm vụ Check-in hoặc Return", example = "501")
    private Long contractId;

    @Schema(description = "ID nhân viên được phân công", example = "8")
    private Long staffId;

    @Schema(description = "ID nhân viên (tương thích thuộc tính assignedUserId)", example = "8")
    private Long assignedUserId;

    @Schema(description = "Loại nhiệm vụ: CHECK_IN, RETURN, INCIDENT, OVERLOCK", example = "CHECK_IN")
    private String taskType;

    @Schema(description = "Mức độ ưu tiên: NORMAL, URGENT", example = "NORMAL")
    private String priority;

    @Schema(description = "Ghi chú chỉ đạo từ Quản lý cơ sở", example = "Tiếp đón khách hàng lúc 09:30 tại quầy lễ tân")
    private String instructions;

    @Schema(description = "Ghi chú ngắn", example = "Tiếp đón khách hàng")
    private String note;

    @Schema(description = "Ghi chú mở rộng (alias của note)")
    private String notes;

    public String getNotes() {
        if (notes != null && !notes.isBlank()) {
            return notes;
        }
        return note;
    }

    public Long getResolvedStaffId() {
        return staffId != null ? staffId : assignedUserId;
    }

    public String getResolvedInstructions() {
        if (instructions != null && !instructions.isBlank()) {
            return instructions;
        }
        return note != null ? note : "Phân công từ bàn điều phối cơ sở";
    }
}
