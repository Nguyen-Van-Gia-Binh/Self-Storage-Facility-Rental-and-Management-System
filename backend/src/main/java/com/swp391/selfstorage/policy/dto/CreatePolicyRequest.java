package com.swp391.selfstorage.policy.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePolicyRequest {

    @Min(value = 1, message = "Số phiên bản phải lớn hơn hoặc bằng 1")
    private Integer versionNo;

    @NotNull(message = "Thời điểm hiệu lực không được để trống")
    private OffsetDateTime effectiveFrom;

    @NotNull(message = "Hệ số cọc không được để trống")
    @DecimalMin(value = "0.0", message = "Hệ số cọc không được âm")
    private BigDecimal depositMultiplier;

    @NotNull(message = "Số giờ giữ chỗ không được để trống")
    @Min(value = 1, message = "Số giờ giữ chỗ tối thiểu là 1")
    private Integer reservationHoldHours;

    @NotNull(message = "Số ngày ân hạn nhận kho không được để trống")
    @Min(value = 0, message = "Số ngày ân hạn nhận kho không được âm")
    private Integer checkinGraceDays;

    @NotNull(message = "Số giờ hủy nhận hoàn tiền 100% không được để trống")
    @Min(value = 0, message = "Số giờ hủy không được âm")
    private Integer cancelFullRefundHours;

    @NotNull(message = "Tỉ lệ hoàn tiền khi hủy trễ không được để trống")
    @DecimalMin(value = "0.0", message = "Tỉ lệ hoàn tiền tối thiểu là 0.0")
    @DecimalMax(value = "1.0", message = "Tỉ lệ hoàn tiền tối đa là 1.0 (100%)")
    private BigDecimal cancelLateRefundRate;

    @NotNull(message = "Tỉ lệ hoàn tiền khi không đến nhận kho không được để trống")
    @DecimalMin(value = "0.0", message = "Tỉ lệ hoàn tiền tối thiểu là 0.0")
    @DecimalMax(value = "1.0", message = "Tỉ lệ hoàn tiền tối đa là 1.0 (100%)")
    private BigDecimal cancelNoShowRefundRate;

    @NotBlank(message = "Cấu hình ngày nhắc gia hạn không được để trống (ví dụ: '30,15,7,3,1')")
    private String renewalReminderDays;

    @NotNull(message = "Số tháng gia hạn tối thiểu không được để trống")
    @Min(value = 1, message = "Số tháng gia hạn tối thiểu là 1")
    private Integer renewalMinMonths;

    @NotNull(message = "Số tháng gia hạn tối đa không được để trống")
    @Min(value = 1, message = "Số tháng gia hạn tối đa là 1")
    private Integer renewalMaxMonths;

    @NotNull(message = "Số ngày ân hạn quá hạn không được để trống")
    @Min(value = 0, message = "Số ngày ân hạn không được âm")
    private Integer overdueGraceDays;

    @NotNull(message = "Mức phí quá hạn mỗi ngày không được để trống")
    @DecimalMin(value = "0.0", message = "Mức phí quá hạn mỗi ngày không được âm")
    @DecimalMax(value = "1.0", message = "Mức phí quá hạn mỗi ngày tối đa là 1.0 (100%)")
    private BigDecimal overdueDailyRate;

    @NotNull(message = "Trần phí quá hạn tối đa không được để trống")
    @DecimalMin(value = "0.0", message = "Trần phí quá hạn tối thiểu là 0.0")
    @DecimalMax(value = "1.0", message = "Trần phí quá hạn tối đa là 1.0 (100%)")
    private BigDecimal overdueCapRate;

    @NotNull(message = "Số ngày khóa quyền truy cập khi quá hạn không được để trống")
    @Min(value = 0, message = "Số ngày khóa quyền truy cập không được âm")
    private Integer overdueLockAccessDays;

    @NotNull(message = "Số ngày gửi thông báo trước khi thanh lý không được để trống")
    @Min(value = 0, message = "Số ngày thông báo không được âm")
    private Integer overdueNoticeDays;

    @NotNull(message = "Số ngày thanh lý hợp đồng quá hạn không được để trống")
    @Min(value = 0, message = "Số ngày thanh lý không được âm")
    private Integer overdueTerminationDays;

    @NotNull(message = "Số ngày báo trước khi trả kho không được để trống")
    @Min(value = 0, message = "Số ngày báo trước không được âm")
    private Integer returnNoticeDays;

    @NotNull(message = "Số ngày làm việc hoàn tiền cọc trả kho không được để trống")
    @Min(value = 0, message = "Số ngày làm việc hoàn tiền không được âm")
    private Integer returnRefundWorkingDays;

    @NotNull(message = "Tỉ lệ hoàn tiền khi trả kho sớm không được để trống")
    @DecimalMin(value = "0.0", message = "Tỉ lệ hoàn tiền tối thiểu là 0.0")
    @DecimalMax(value = "1.0", message = "Tỉ lệ hoàn tiền tối đa là 1.0 (100%)")
    private BigDecimal returnEarlyRefundRate;

    @Min(value = 4, message = "Độ dài mã PIN tối thiểu là 4 ký tự")
    @Max(value = 10, message = "Độ dài mã PIN tối đa là 10 ký tự")
    private Integer accessPinLength;

    @NotNull(message = "SLA hỗ trợ khẩn cấp (giờ) không được để trống")
    @Min(value = 1, message = "SLA hỗ trợ khẩn cấp tối thiểu là 1 giờ")
    private Integer supportUrgentSlaHours;

    @NotNull(message = "Số ngày làm việc tự động đóng hỗ trợ không được để trống")
    @Min(value = 1, message = "Số ngày tự đóng hỗ trợ tối thiểu là 1")
    private Integer supportAutoCloseWorkingDays;
}
