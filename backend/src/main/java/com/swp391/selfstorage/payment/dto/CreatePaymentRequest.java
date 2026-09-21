package com.swp391.selfstorage.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePaymentRequest {

    @NotBlank(message = "Loại tham chiếu không được để trống")
    private String referenceType; // RESERVATION, RENEWAL, OVERDUE_FEE, EXTRA_CHARGE

    @NotNull(message = "ID tham chiếu không được để trống")
    @Positive(message = "ID tham chiếu phải lớn hơn 0")
    private Long referenceId;

    @NotNull(message = "Số tiền không được để trống")
    @Positive(message = "Số tiền thanh toán phải lớn hơn 0")
    private Long amount;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String method; // BANK_TRANSFER, CREDIT_CARD, CASH

    private String transactionRef; // Mã giao dịch đối tác/ngân hàng (tùy chọn)
}
