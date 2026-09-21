package com.swp391.selfstorage.reservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * DTO tiếp nhận yêu cầu dời lịch hẹn check-in nhận kho từ khách hàng (US-SC-04.3).
 */
@Schema(description = "Yêu cầu dời lịch hẹn Check-in nhận kho")
public class RescheduleAppointmentRequest {

    @Schema(description = "Ngày hẹn check-in mới dự kiến", example = "2026-10-05", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Ngày hẹn mới không được để trống")
    @FutureOrPresent(message = "Ngày hẹn mới không được ở trong quá khứ")
    private LocalDate newAppointmentDate;

    @Schema(description = "Lý do dời lịch hẹn", example = "Bận chuyến công tác đột xuất, xin dời ngày nhận kho")
    @Size(max = 500, message = "Lý do không được vượt quá 500 ký tự")
    private String reason;

    public RescheduleAppointmentRequest() {}

    public RescheduleAppointmentRequest(LocalDate newAppointmentDate, String reason) {
        this.newAppointmentDate = newAppointmentDate;
        this.reason = reason;
    }

    public LocalDate getNewAppointmentDate() { return newAppointmentDate; }
    public void setNewAppointmentDate(LocalDate newAppointmentDate) { this.newAppointmentDate = newAppointmentDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
