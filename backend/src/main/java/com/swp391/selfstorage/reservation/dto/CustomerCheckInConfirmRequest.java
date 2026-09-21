package com.swp391.selfstorage.reservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

/**
 * DTO tiếp nhận xác nhận đã nhận bàn giao ô kho từ phía khách hàng (US-SC-04.2).
 */
@Schema(description = "Yêu cầu xác nhận đã nhận bàn giao ô kho")
public class CustomerCheckInConfirmRequest {

    @Schema(description = "Khách hàng xác nhận đồng ý nhận kho", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    @AssertTrue(message = "Bạn cần xác nhận đồng ý nhận bàn giao ô kho")
    private boolean confirmed;

    @Schema(description = "Khách hàng xác nhận hiện trạng ô kho đạt yêu cầu", example = "true")
    private boolean conditionAccepted = true;

    @Schema(description = "Ghi chú của khách hàng khi nhận kho", example = "Kho sạch sẽ, cửa và khóa thông minh hoạt động tốt")
    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String customerNotes;

    public CustomerCheckInConfirmRequest() {}

    public CustomerCheckInConfirmRequest(boolean confirmed, boolean conditionAccepted, String customerNotes) {
        this.confirmed = confirmed;
        this.conditionAccepted = conditionAccepted;
        this.customerNotes = customerNotes;
    }

    public boolean isConfirmed() { return confirmed; }
    public void setConfirmed(boolean confirmed) { this.confirmed = confirmed; }

    public boolean isConditionAccepted() { return conditionAccepted; }
    public void setConditionAccepted(boolean conditionAccepted) { this.conditionAccepted = conditionAccepted; }

    public String getCustomerNotes() { return customerNotes; }
    public void setCustomerNotes(String customerNotes) { this.customerNotes = customerNotes; }
}
