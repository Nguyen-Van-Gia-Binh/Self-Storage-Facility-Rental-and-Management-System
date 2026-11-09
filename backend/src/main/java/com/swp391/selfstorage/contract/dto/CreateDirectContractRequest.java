package com.swp391.selfstorage.contract.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDirectContractRequest {

    /**
     * ID khách hàng (nếu đã có tài khoản trên hệ thống)
     */
    private Long customerId;

    /**
     * Họ tên khách hàng (nếu khách vãng lai hoặc cập nhật hồ sơ)
     */
    private String customerFullName;

    /**
     * Email khách hàng (nếu khách vãng lai)
     */
    private String customerEmail;

    /**
     * Số điện thoại liên hệ của khách hàng (bổ sung/cập nhật nếu tài khoản chưa có)
     */
    private String customerPhone;

    @NotNull(message = "Mã cơ sở không được để trống")
    private Long facilityId;

    @NotNull(message = "Hạng kho không được để trống")
    private Long unitTypeId;

    /**
     * Ô kho vật lý cụ thể (tùy chọn). Nếu không chọn, hợp đồng sẽ được gán sau trên Sơ đồ 2D.
     */
    private Long storageUnitId;

    @NotNull(message = "Ngày bắt đầu thuê không được để trống")
    @FutureOrPresent(message = "Ngày bắt đầu thuê phải từ hôm nay trở đi")
    private LocalDate startDate;

    @Min(value = 1, message = "Thời hạn thuê tối thiểu là 1 tháng")
    @Max(value = 12, message = "Thời hạn thuê tối đa là 12 tháng")
    @Builder.Default
    private int rentalMonths = 1;

    /**
     * Phương thức thanh toán cọc tại quầy: CASH, BANK_TRANSFER
     */
    @Builder.Default
    private String paymentMethod = "CASH";

    /**
     * ID đơn Waitlist liên kết (nếu tạo hợp đồng trực tiếp từ danh sách chờ CRM)
     */
    private Long waitlistId;

    /**
     * Ghi chú thỏa thuận hợp đồng
     */
    private String notes;
}

