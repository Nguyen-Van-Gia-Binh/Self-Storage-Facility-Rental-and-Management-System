package com.swp391.selfstorage.reservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;

/**
 * Phản hồi sau khi khách hàng xác nhận nhận kho thành công (US-SC-04.2).
 * Cung cấp mã PIN Access Code bảo mật để mở khóa ô kho.
 */
@Schema(description = "Kết quả xác nhận Check-in và bàn giao ô kho")
public class CustomerCheckInResponse {

    @Schema(description = "ID đơn đặt chỗ", example = "1042")
    private Long reservationId;

    @Schema(description = "Mã đơn đặt chỗ", example = "RSV-2026-001042")
    private String reservationCode;

    @Schema(description = "ID hợp đồng thuê", example = "500")
    private Long contractId;

    @Schema(description = "Mã hợp đồng thuê", example = "CTR-202610-001")
    private String contractCode;

    @Schema(description = "Trạng thái đơn đặt chỗ", example = "FULFILLED")
    private String reservationStatus;

    @Schema(description = "Trạng thái hợp đồng thuê", example = "ACTIVE")
    private String contractStatus;

    @Schema(description = "Mã ô kho vật lý", example = "S-101")
    private String storageUnitCode;

    @Schema(description = "Mã PIN Access Code bảo mật để mở khóa ô kho (BR-ACC-01)", example = "482019")
    private String accessCode;

    @Schema(description = "Thời điểm hoàn tất nhận bàn giao kho")
    private OffsetDateTime confirmedAt;

    @Schema(description = "Thông báo kết quả", example = "Xác nhận nhận bàn giao ô kho thành công. Chúc mừng bạn đã bắt đầu sử dụng kho!")
    private String message;

    public CustomerCheckInResponse() {}

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public String getReservationCode() { return reservationCode; }
    public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public String getContractCode() { return contractCode; }
    public void setContractCode(String contractCode) { this.contractCode = contractCode; }

    public String getReservationStatus() { return reservationStatus; }
    public void setReservationStatus(String reservationStatus) { this.reservationStatus = reservationStatus; }

    public String getContractStatus() { return contractStatus; }
    public void setContractStatus(String contractStatus) { this.contractStatus = contractStatus; }

    public String getStorageUnitCode() { return storageUnitCode; }
    public void setStorageUnitCode(String storageUnitCode) { this.storageUnitCode = storageUnitCode; }

    public String getAccessCode() { return accessCode; }
    public void setAccessCode(String accessCode) { this.accessCode = accessCode; }

    public OffsetDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(OffsetDateTime confirmedAt) { this.confirmedAt = confirmedAt; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
