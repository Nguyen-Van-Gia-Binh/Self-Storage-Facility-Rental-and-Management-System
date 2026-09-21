package com.swp391.selfstorage.reservation.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Phản hồi chi tiết thông tin đơn đặt chỗ và thanh toán VietQR.
 */
public class ReservationResponse {

    private Long id;
    private String code;
    private Long facilityId;
    private String facilityName;
    private Long unitTypeId;
    private String unitTypeName;
    private Long storageUnitId;
    private String storageUnitCode;

    private LocalDate startDate;
    private int rentalMonths;
    private LocalDate endDateExclusive;

    private long monthlyPrice;
    private long discountAmount;
    private long depositAmount;
    private long totalRentalFee;
    private long totalPayable;

    private String status;
    private Long customerId;
    private OffsetDateTime holdExpiresAt;
    private Instant createdAt;
    private OffsetDateTime confirmedAt;
    private OffsetDateTime fulfilledAt;
    private OffsetDateTime cancelledAt;
    private String cancelReason;
    private String vietQrPayload;
    private String bankAccountNumber;
    private String bankName;
    private String transferContent;

    public ReservationResponse() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public Long getUnitTypeId() { return unitTypeId; }
    public void setUnitTypeId(Long unitTypeId) { this.unitTypeId = unitTypeId; }

    public String getUnitTypeName() { return unitTypeName; }
    public void setUnitTypeName(String unitTypeName) { this.unitTypeName = unitTypeName; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public String getStorageUnitCode() { return storageUnitCode; }
    public void setStorageUnitCode(String storageUnitCode) { this.storageUnitCode = storageUnitCode; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public int getRentalMonths() { return rentalMonths; }
    public void setRentalMonths(int rentalMonths) { this.rentalMonths = rentalMonths; }

    public LocalDate getEndDateExclusive() { return endDateExclusive; }
    public void setEndDateExclusive(LocalDate endDateExclusive) { this.endDateExclusive = endDateExclusive; }

    public long getMonthlyPrice() { return monthlyPrice; }
    public void setMonthlyPrice(long monthlyPrice) { this.monthlyPrice = monthlyPrice; }

    public long getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(long discountAmount) { this.discountAmount = discountAmount; }

    public long getDepositAmount() { return depositAmount; }
    public void setDepositAmount(long depositAmount) { this.depositAmount = depositAmount; }

    public long getTotalRentalFee() { return totalRentalFee; }
    public void setTotalRentalFee(long totalRentalFee) { this.totalRentalFee = totalRentalFee; }

    public long getTotalPayable() { return totalPayable; }
    public void setTotalPayable(long totalPayable) { this.totalPayable = totalPayable; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getHoldExpiresAt() { return holdExpiresAt; }
    public void setHoldExpiresAt(OffsetDateTime holdExpiresAt) { this.holdExpiresAt = holdExpiresAt; }

    public String getVietQrPayload() { return vietQrPayload; }
    public void setVietQrPayload(String vietQrPayload) { this.vietQrPayload = vietQrPayload; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getTransferContent() { return transferContent; }
    public void setTransferContent(String transferContent) { this.transferContent = transferContent; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(OffsetDateTime confirmedAt) { this.confirmedAt = confirmedAt; }

    public OffsetDateTime getFulfilledAt() { return fulfilledAt; }
    public void setFulfilledAt(OffsetDateTime fulfilledAt) { this.fulfilledAt = fulfilledAt; }

    public OffsetDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(OffsetDateTime cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
}
