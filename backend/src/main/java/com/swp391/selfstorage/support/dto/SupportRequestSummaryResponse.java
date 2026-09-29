package com.swp391.selfstorage.support.dto;

import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;

import java.time.OffsetDateTime;

/**
 * Response tóm tắt danh sách yêu cầu hỗ trợ (GET /api/v1/support-requests).
 */
public class SupportRequestSummaryResponse {

    private Long id;
    private String code;
    private Long customerId;
    private Long contractId;
    private String contractCode;
    private Long storageUnitId;
    private String storageUnitCode;
    private String facilityName;

    private SupportCategory category;
    private String categoryDisplayName;
    private String description;
    private SupportStatus status;
    private String statusDisplayName;

    private Boolean isUrgent;
    private Long assignedStaffId;
    private String assignedStaffName;

    private OffsetDateTime slaDueAt;
    private OffsetDateTime resolvedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Boolean relocationRequired;
    private String customerNotice;

    public SupportRequestSummaryResponse() {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final SupportRequestSummaryResponse r = new SupportRequestSummaryResponse();

        public Builder id(Long id) { r.id = id; return this; }
        public Builder code(String code) { r.code = code; return this; }
        public Builder customerId(Long customerId) { r.customerId = customerId; return this; }
        public Builder contractId(Long contractId) { r.contractId = contractId; return this; }
        public Builder contractCode(String contractCode) { r.contractCode = contractCode; return this; }
        public Builder storageUnitId(Long storageUnitId) { r.storageUnitId = storageUnitId; return this; }
        public Builder storageUnitCode(String storageUnitCode) { r.storageUnitCode = storageUnitCode; return this; }
        public Builder facilityName(String facilityName) { r.facilityName = facilityName; return this; }
        public Builder category(SupportCategory category) { r.category = category; return this; }
        public Builder categoryDisplayName(String categoryDisplayName) { r.categoryDisplayName = categoryDisplayName; return this; }
        public Builder description(String description) { r.description = description; return this; }
        public Builder status(SupportStatus status) { r.status = status; return this; }
        public Builder statusDisplayName(String statusDisplayName) { r.statusDisplayName = statusDisplayName; return this; }
        public Builder isUrgent(Boolean isUrgent) { r.isUrgent = isUrgent; return this; }
        public Builder assignedStaffId(Long assignedStaffId) { r.assignedStaffId = assignedStaffId; return this; }
        public Builder assignedStaffName(String assignedStaffName) { r.assignedStaffName = assignedStaffName; return this; }
        public Builder slaDueAt(OffsetDateTime slaDueAt) { r.slaDueAt = slaDueAt; return this; }
        public Builder resolvedAt(OffsetDateTime resolvedAt) { r.resolvedAt = resolvedAt; return this; }
        public Builder createdAt(OffsetDateTime createdAt) { r.createdAt = createdAt; return this; }
        public Builder updatedAt(OffsetDateTime updatedAt) { r.updatedAt = updatedAt; return this; }
        public Builder relocationRequired(Boolean relocationRequired) { r.relocationRequired = relocationRequired; return this; }
        public Builder customerNotice(String customerNotice) { r.customerNotice = customerNotice; return this; }

        public SupportRequestSummaryResponse build() {
            return r;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public String getContractCode() { return contractCode; }
    public void setContractCode(String contractCode) { this.contractCode = contractCode; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public String getStorageUnitCode() { return storageUnitCode; }
    public void setStorageUnitCode(String storageUnitCode) { this.storageUnitCode = storageUnitCode; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public SupportCategory getCategory() { return category; }
    public void setCategory(SupportCategory category) { this.category = category; }

    public String getCategoryDisplayName() { return categoryDisplayName; }
    public void setCategoryDisplayName(String categoryDisplayName) { this.categoryDisplayName = categoryDisplayName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SupportStatus getStatus() { return status; }
    public void setStatus(SupportStatus status) { this.status = status; }

    public String getStatusDisplayName() { return statusDisplayName; }
    public void setStatusDisplayName(String statusDisplayName) { this.statusDisplayName = statusDisplayName; }

    public Boolean getIsUrgent() { return isUrgent; }
    public void setIsUrgent(Boolean isUrgent) { this.isUrgent = isUrgent; }

    public Long getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; }

    public String getAssignedStaffName() { return assignedStaffName; }
    public void setAssignedStaffName(String assignedStaffName) { this.assignedStaffName = assignedStaffName; }

    public OffsetDateTime getSlaDueAt() { return slaDueAt; }
    public void setSlaDueAt(OffsetDateTime slaDueAt) { this.slaDueAt = slaDueAt; }

    public OffsetDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getRelocationRequired() { return relocationRequired; }
    public void setRelocationRequired(Boolean relocationRequired) { this.relocationRequired = relocationRequired; }

    public String getCustomerNotice() { return customerNotice; }
    public void setCustomerNotice(String customerNotice) { this.customerNotice = customerNotice; }
}
