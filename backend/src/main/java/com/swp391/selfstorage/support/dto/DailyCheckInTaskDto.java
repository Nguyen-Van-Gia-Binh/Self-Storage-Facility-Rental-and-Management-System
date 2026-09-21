package com.swp391.selfstorage.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "Nhiệm vụ tiếp đón khách nhận kho trong ca trực (Check-in / Handover - FS-06, FS-01, FS-02)")
public class DailyCheckInTaskDto {

    @Schema(description = "ID hợp đồng")
    private Long contractId;

    @Schema(description = "Mã hợp đồng")
    private String contractCode;

    @Schema(description = "ID đơn giữ chỗ (nếu có)")
    private Long reservationId;

    @Schema(description = "ID khách hàng")
    private Long customerId;

    @Schema(description = "Tên khách hàng")
    private String customerName;

    @Schema(description = "Số điện thoại khách hàng")
    private String customerPhone;

    @Schema(description = "ID ô kho")
    private Long storageUnitId;

    @Schema(description = "Mã ô kho")
    private String storageUnitCode;

    @Schema(description = "ID cơ sở")
    private Long facilityId;

    @Schema(description = "Tên cơ sở")
    private String facilityName;

    @Schema(description = "Ngày hẹn bắt đầu thuê / nhận kho")
    private LocalDate scheduledDate;

    @Schema(description = "Trạng thái tiếp đón (PENDING, COMPLETED, CANCELLED)")
    private String status;

    @Schema(description = "Cờ đánh dấu đã hoàn tất bàn giao")
    private boolean completed;

    public DailyCheckInTaskDto() {
    }

    public DailyCheckInTaskDto(Long contractId, String contractCode, Long reservationId,
                               Long customerId, String customerName, String customerPhone,
                               Long storageUnitId, String storageUnitCode,
                               Long facilityId, String facilityName,
                               LocalDate scheduledDate, String status, boolean completed) {
        this.contractId = contractId;
        this.contractCode = contractCode;
        this.reservationId = reservationId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.storageUnitId = storageUnitId;
        this.storageUnitCode = storageUnitCode;
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.scheduledDate = scheduledDate;
        this.status = status;
        this.completed = completed;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getContractId() {
        return contractId;
    }

    public void setContractId(Long contractId) {
        this.contractId = contractId;
    }

    public String getContractCode() {
        return contractCode;
    }

    public void setContractCode(String contractCode) {
        this.contractCode = contractCode;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public Long getStorageUnitId() {
        return storageUnitId;
    }

    public void setStorageUnitId(Long storageUnitId) {
        this.storageUnitId = storageUnitId;
    }

    public String getStorageUnitCode() {
        return storageUnitCode;
    }

    public void setStorageUnitCode(String storageUnitCode) {
        this.storageUnitCode = storageUnitCode;
    }

    public Long getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Long facilityId) {
        this.facilityId = facilityId;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public static class Builder {
        private Long contractId;
        private String contractCode;
        private Long reservationId;
        private Long customerId;
        private String customerName;
        private String customerPhone;
        private Long storageUnitId;
        private String storageUnitCode;
        private Long facilityId;
        private String facilityName;
        private LocalDate scheduledDate;
        private String status;
        private boolean completed;

        public Builder contractId(Long contractId) {
            this.contractId = contractId;
            return this;
        }

        public Builder contractCode(String contractCode) {
            this.contractCode = contractCode;
            return this;
        }

        public Builder reservationId(Long reservationId) {
            this.reservationId = reservationId;
            return this;
        }

        public Builder customerId(Long customerId) {
            this.customerId = customerId;
            return this;
        }

        public Builder customerName(String customerName) {
            this.customerName = customerName;
            return this;
        }

        public Builder customerPhone(String customerPhone) {
            this.customerPhone = customerPhone;
            return this;
        }

        public Builder storageUnitId(Long storageUnitId) {
            this.storageUnitId = storageUnitId;
            return this;
        }

        public Builder storageUnitCode(String storageUnitCode) {
            this.storageUnitCode = storageUnitCode;
            return this;
        }

        public Builder facilityId(Long facilityId) {
            this.facilityId = facilityId;
            return this;
        }

        public Builder facilityName(String facilityName) {
            this.facilityName = facilityName;
            return this;
        }

        public Builder scheduledDate(LocalDate scheduledDate) {
            this.scheduledDate = scheduledDate;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder completed(boolean completed) {
            this.completed = completed;
            return this;
        }

        public DailyCheckInTaskDto build() {
            return new DailyCheckInTaskDto(contractId, contractCode, reservationId, customerId, customerName, customerPhone,
                    storageUnitId, storageUnitCode, facilityId, facilityName, scheduledDate, status, completed);
        }
    }
}
