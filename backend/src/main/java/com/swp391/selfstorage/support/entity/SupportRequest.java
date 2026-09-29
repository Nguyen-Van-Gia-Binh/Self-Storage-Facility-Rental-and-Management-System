package com.swp391.selfstorage.support.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

/**
 * Entity lưu trữ phiếu yêu cầu hỗ trợ / sự cố (bảng support_request - Flow 7, SC-06).
 */
@Entity
@Table(name = "support_request")
public class SupportRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "storage_unit_id")
    private Long storageUnitId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private SupportCategory category;

    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SupportStatus status = SupportStatus.NEW;

    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Column(name = "sla_due_at")
    private OffsetDateTime slaDueAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "resolution_note", length = 1000)
    private String resolutionNote;

    @Transient
    private Boolean isUrgent;

    @Column(name = "customer_confirmed_at")
    private OffsetDateTime customerConfirmedAt;

    @Column(name = "auto_closed_at")
    private OffsetDateTime autoClosedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "relocation_required", nullable = false)
    private Boolean relocationRequired = Boolean.FALSE;

    @Column(name = "customer_notice", length = 500)
    private String customerNotice;

    public SupportRequest() {}

    public SupportRequest(Long id, String code, Long customerId, Long contractId, Long storageUnitId,
                          SupportCategory category, String description, SupportStatus status,
                          Long assignedStaffId, OffsetDateTime slaDueAt, OffsetDateTime resolvedAt,
                          String resolutionNote, Boolean isUrgent, OffsetDateTime customerConfirmedAt,
                          OffsetDateTime autoClosedAt, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.code = code;
        this.customerId = customerId;
        this.contractId = contractId;
        this.storageUnitId = storageUnitId;
        this.category = category;
        this.description = description;
        this.status = status != null ? status : SupportStatus.NEW;
        this.assignedStaffId = assignedStaffId;
        this.slaDueAt = slaDueAt;
        this.resolvedAt = resolvedAt;
        this.resolutionNote = resolutionNote;
        this.isUrgent = isUrgent;
        this.customerConfirmedAt = customerConfirmedAt;
        this.autoClosedAt = autoClosedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String code;
        private Long customerId;
        private Long contractId;
        private Long storageUnitId;
        private SupportCategory category;
        private String description;
        private SupportStatus status = SupportStatus.NEW;
        private Long assignedStaffId;
        private OffsetDateTime slaDueAt;
        private OffsetDateTime resolvedAt;
        private String resolutionNote;
        private Boolean isUrgent;
        private OffsetDateTime customerConfirmedAt;
        private OffsetDateTime autoClosedAt;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
        private Boolean relocationRequired = Boolean.FALSE;
        private String customerNotice;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder code(String code) { this.code = code; return this; }
        public Builder customerId(Long customerId) { this.customerId = customerId; return this; }
        public Builder contractId(Long contractId) { this.contractId = contractId; return this; }
        public Builder storageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; return this; }
        public Builder category(SupportCategory category) { this.category = category; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder status(SupportStatus status) { this.status = status; return this; }
        public Builder assignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; return this; }
        public Builder slaDueAt(OffsetDateTime slaDueAt) { this.slaDueAt = slaDueAt; return this; }
        public Builder resolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; return this; }
        public Builder resolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; return this; }
        public Builder isUrgent(Boolean isUrgent) { this.isUrgent = isUrgent; return this; }
        public Builder customerConfirmedAt(OffsetDateTime customerConfirmedAt) { this.customerConfirmedAt = customerConfirmedAt; return this; }
        public Builder autoClosedAt(OffsetDateTime autoClosedAt) { this.autoClosedAt = autoClosedAt; return this; }
        public Builder createdAt(OffsetDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder relocationRequired(Boolean relocationRequired) { this.relocationRequired = relocationRequired; return this; }
        public Builder customerNotice(String customerNotice) { this.customerNotice = customerNotice; return this; }

        public SupportRequest build() {
            SupportRequest request = new SupportRequest(id, code, customerId, contractId, storageUnitId,
                    category, description, status, assignedStaffId, slaDueAt,
                    resolvedAt, resolutionNote, isUrgent, customerConfirmedAt,
                    autoClosedAt, createdAt, updatedAt);
            request.setRelocationRequired(relocationRequired != null ? relocationRequired : Boolean.FALSE);
            request.setCustomerNotice(customerNotice);
            return request;
        }
    }

    public boolean isUrgent() {
        if (isUrgent != null) return isUrgent;
        if (category == SupportCategory.LOCK_ACCESS) return true;
        if (createdAt != null && slaDueAt != null) {
            return java.time.Duration.between(createdAt, slaDueAt).toHours() <= 4;
        }
        return false;
    }

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.status == null) {
            this.status = SupportStatus.NEW;
        }
        if (this.relocationRequired == null) {
            this.relocationRequired = Boolean.FALSE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public SupportCategory getCategory() { return category; }
    public void setCategory(SupportCategory category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SupportStatus getStatus() { return status; }
    public void setStatus(SupportStatus status) { this.status = status; }

    public Long getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; }

    public OffsetDateTime getSlaDueAt() { return slaDueAt; }
    public void setSlaDueAt(OffsetDateTime slaDueAt) { this.slaDueAt = slaDueAt; }

    public OffsetDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }

    public Boolean getIsUrgent() { return isUrgent; }
    public void setIsUrgent(Boolean isUrgent) { this.isUrgent = isUrgent; }

    public OffsetDateTime getCustomerConfirmedAt() { return customerConfirmedAt; }
    public void setCustomerConfirmedAt(OffsetDateTime customerConfirmedAt) { this.customerConfirmedAt = customerConfirmedAt; }

    public OffsetDateTime getAutoClosedAt() { return autoClosedAt; }
    public void setAutoClosedAt(OffsetDateTime autoClosedAt) { this.autoClosedAt = autoClosedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getRelocationRequired() { return relocationRequired; }
    public void setRelocationRequired(Boolean relocationRequired) { this.relocationRequired = relocationRequired; }

    public String getCustomerNotice() { return customerNotice; }
    public void setCustomerNotice(String customerNotice) { this.customerNotice = customerNotice; }
}
