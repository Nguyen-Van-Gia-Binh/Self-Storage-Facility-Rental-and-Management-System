package com.swp391.selfstorage.reservation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * FM gán hoặc đổi ô kho và phân công nhân viên tiếp đón (BR-AVL-04, DEC-01, FM-05).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignUnitRequest {

    @NotNull(message = "Mã ô kho không được để trống")
    private Long storageUnitId;

    @NotNull(message = "Vui lòng chọn nhân viên tiếp đón")
    private Long staffId;

    private LocalDate scheduledDate; // Nếu null -> Fallback về startDate của đơn

    @NotNull(message = "Vui lòng chọn giờ bắt đầu tiếp đón")
    private LocalTime scheduledStartTime;

    @NotNull(message = "Vui lòng chọn giờ kết thúc tiếp đón")
    private LocalTime scheduledEndTime;

    private String notes;

    public AssignUnitRequest(Long storageUnitId) {
        this.storageUnitId = storageUnitId;
    }
}
