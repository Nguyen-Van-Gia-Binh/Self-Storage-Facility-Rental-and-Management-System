package com.swp391.selfstorage.support.dto;

import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Response chi tiết đầy đủ yêu cầu hỗ trợ (GET /api/v1/support-requests/{id}).
 */
public class SupportRequestDetailResponse {

    private Long id;
    private String code;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long contractId;
    private String contractCode;
    private Long storageUnitId;
    private String storageUnitCode;
    private Long facilityId;
    private String facilityName;

    private SupportCategory category;
    private String categoryDisplayName;
    private String description;
    private SupportStatus status;
    private String statusDisplayName;

    private Boolean isUrgent;
    private Long assignedStaffId;
    private String assignedStaffName;
    private String assignedStaffPhone;

    private OffsetDateTime slaDueAt;
    private OffsetDateTime resolvedAt;
    private String resolutionNote;
    private OffsetDateTime customerConfirmedAt;
    private OffsetDateTime autoClosedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    private List<String> attachmentUrls;
    private List<String> resolutionAttachmentUrls;

    private boolean canCancel;
    private boolean canConfirm;
    private Boolean relocationRequired;
    private String customerNotice;

    public SupportRequestDetailResponse() {}

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final SupportRequestDetailResponse r = new SupportRequestDetailResponse();

        public Builder id(Long id) { r.id = id; return this; }
        public Builder code(String code) { r.code = code; return this; }
        public Builder customerId(Long customerId) { r.customerId = customerId; return this; }
        public Builder customerName(String customerName) { r.customerName = customerName; return this; }
        public Builder customerPhone(String customerPhone) { r.customerPhone = customerPhone; return this; }
        public Builder contractId(Long contractId) { r.contractId = contractId; return this; }
        public Builder contractCode(String contractCode) { r.contractCode = contractCode; return this; }
        public Builder storageUnitId(Long storageUnitId) { r.storageUnitId = storageUnitId; return this; }
        public Builder storageUnitCode(String storageUnitCode) { r.storageUnitCode = storageUnitCode; return this; }
        public Builder facilityId(Long facilityId) { r.facilityId = facilityId; return this; }
        public Builder facilityName(String facilityName) { r.facilityName = facilityName; return this; }
        public Builder category(SupportCategory category) { r.category = category; return this; }
        public Builder categoryDisplayName(String categoryDisplayName) { r.categoryDisplayName = categoryDisplayName; return this; }
        public Builder description(String description) { r.description = description; return this; }
        public Builder status(SupportStatus status) { r.status = status; return this; }
        public Builder statusDisplayName(String statusDisplayName) { r.statusDisplayName = statusDisplayName; return this; }
        public Builder isUrgent(Boolean isUrgent) { r.isUrgent = isUrgent; return this; }
        public Builder assignedStaffId(Long assignedStaffId) { r.assignedStaffId = assignedStaffId; return this; }
        public Builder assignedStaffName(String assignedStaffName) { r.assignedStaffName = assignedStaffName; return this; }
        public Builder assignedStaffPhone(String assignedStaffPhone) { r.assignedStaffPhone = assignedStaffPhone; return this; }
        public Builder slaDueAt(OffsetDateTime slaDueAt) { r.slaDueAt = slaDueAt; return this; }
        public Builder resolvedAt(OffsetDateTime resolvedAt) { r.resolvedAt = resolvedAt; return this; }
        public Builder resolutionNote(String resolutionNote) { r.resolutionNote = resolutionNote; return this; }
        public Builder customerConfirmedAt(OffsetDateTime customerConfirmedAt) { r.customerConfirmedAt = customerConfirmedAt; return this; }
        public Builder autoClosedAt(OffsetDateTime autoClosedAt) { r.autoClosedAt = autoClosedAt; return this; }
        public Builder createdAt(OffsetDateTime createdAt) { r.createdAt = createdAt; return this; }
        public Builder updatedAt(OffsetDateTime updatedAt) { r.updatedAt = updatedAt; return this; }
        public Builder attachmentUrls(List<String> attachmentUrls) { r.attachmentUrls = attachmentUrls; return this; }
        public Builder resolutionAttachmentUrls(List<String> resolutionAttachmentUrls) { r.resolutionAttachmentUrls = resolutionAttachmentUrls; return this; }
        public Builder canCancel(boolean canCancel) { r.canCancel = canCancel; return this; }
        public Builder canConfirm(boolean canConfirm) { r.canConfirm = canConfirm; return this; }
        public Builder relocationRequired(Boolean relocationRequired) { r.relocationRequired = relocationRequired; return this; }
        public Builder customerNotice(String customerNotice) { r.customerNotice = customerNotice; return this; }

        public SupportRequestDetailResponse build() {
            return r;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public String getContractCode() { return contractCode; }
    public void setContractCode(String contractCode) { this.contractCode = contractCode; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public String getStorageUnitCode() { return storageUnitCode; }
    public void setStorageUnitCode(String storageUnitCode) { this.storageUnitCode = storageUnitCode; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

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

    public String getAssignedStaffPhone() { return assignedStaffPhone; }
    public void setAssignedStaffPhone(String assignedStaffPhone) { this.assignedStaffPhone = assignedStaffPhone; }

    public OffsetDateTime getSlaDueAt() { return slaDueAt; }
    public void setSlaDueAt(OffsetDateTime slaDueAt) { this.slaDueAt = slaDueAt; }

    public OffsetDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }

    public OffsetDateTime getCustomerConfirmedAt() { return customerConfirmedAt; }
    public void setCustomerConfirmedAt(OffsetDateTime customerConfirmedAt) { this.customerConfirmedAt = customerConfirmedAt; }

    public OffsetDateTime getAutoClosedAt() { return autoClosedAt; }
    public void setAutoClosedAt(OffsetDateTime autoClosedAt) { this.autoClosedAt = autoClosedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<String> getAttachmentUrls() { return attachmentUrls; }
    public void setAttachmentUrls(List<String> attachmentUrls) { this.attachmentUrls = attachmentUrls; }

    public List<String> getResolutionAttachmentUrls() { return resolutionAttachmentUrls; }
    public void setResolutionAttachmentUrls(List<String> resolutionAttachmentUrls) { this.resolutionAttachmentUrls = resolutionAttachmentUrls; }

    public boolean isCanCancel() { return canCancel; }
    public void setCanCancel(boolean canCancel) { this.canCancel = canCancel; }

    public boolean isCanConfirm() { return canConfirm; }
    public void setCanConfirm(boolean canConfirm) { this.canConfirm = canConfirm; }

    public Boolean getRelocationRequired() { return relocationRequired; }
    public void setRelocationRequired(Boolean relocationRequired) { this.relocationRequired = relocationRequired; }

    public String getCustomerNotice() { return customerNotice; }
    public void setCustomerNotice(String customerNotice) { this.customerNotice = customerNotice; }
}
