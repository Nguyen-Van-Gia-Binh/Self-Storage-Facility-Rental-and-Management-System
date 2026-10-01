package com.swp391.selfstorage.support.dto;

import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

@Schema(description = "Nhiệm vụ sự cố / hỗ trợ kỹ thuật và vận hành trong ca trực (Support / Operation - FS-06, FS-05)")
public class DailySupportTaskDto {

    @Schema(description = "ID yêu cầu hỗ trợ")
    private Long supportRequestId;

    @Schema(description = "Mã yêu cầu hỗ trợ")
    private String code;

    @Schema(description = "Danh mục sự cố")
    private SupportCategory category;

    @Schema(description = "Tên hiển thị danh mục")
    private String categoryDisplayName;

    @Schema(description = "Mô tả chi tiết sự cố")
    private String description;

    @Schema(description = "ID ô kho")
    private Long storageUnitId;

    @Schema(description = "Mã ô kho")
    private String storageUnitCode;

    @Schema(description = "ID cơ sở")
    private Long facilityId;

    @Schema(description = "Tên cơ sở")
    private String facilityName;

    @Schema(description = "Mức độ khẩn cấp")
    private Boolean isUrgent;

    @Schema(description = "Hạn chót cam kết dịch vụ (SLA)")
    private OffsetDateTime slaDueAt;

    @Schema(description = "ID khách hàng")
    private Long customerId;

    @Schema(description = "Họ tên khách hàng")
    private String customerName;

    @Schema(description = "Số điện thoại khách hàng")
    private String customerPhone;

    @Schema(description = "Thời điểm gửi yêu cầu")
    private OffsetDateTime createdAt;

    @Schema(description = "Trạng thái sự cố")
    private SupportStatus status;

    @Schema(description = "Tên hiển thị trạng thái")
    private String statusDisplayName;

    @Schema(description = "Cờ đánh dấu đã hoàn thành xử lý sự cố")
    private boolean completed;

    public DailySupportTaskDto() {
    }

    public DailySupportTaskDto(Long supportRequestId, String code, SupportCategory category,
                               String categoryDisplayName, String description,
                               Long storageUnitId, String storageUnitCode,
                               Long facilityId, String facilityName,
                               Boolean isUrgent, OffsetDateTime slaDueAt,
                               SupportStatus status, String statusDisplayName,
                               boolean completed) {
        this(supportRequestId, code, category, categoryDisplayName, description,
                storageUnitId, storageUnitCode, facilityId, facilityName,
                null, null, null,
                isUrgent, slaDueAt, status, statusDisplayName, completed);
    }

    public DailySupportTaskDto(Long supportRequestId, String code, SupportCategory category,
                               String categoryDisplayName, String description,
                               Long storageUnitId, String storageUnitCode,
                               Long facilityId, String facilityName,
                               Long customerId, String customerName, String customerPhone,
                               Boolean isUrgent, OffsetDateTime slaDueAt,
                               SupportStatus status, String statusDisplayName,
                               boolean completed) {
        this.supportRequestId = supportRequestId;
        this.code = code;
        this.category = category;
        this.categoryDisplayName = categoryDisplayName;
        this.description = description;
        this.storageUnitId = storageUnitId;
        this.storageUnitCode = storageUnitCode;
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.isUrgent = isUrgent;
        this.slaDueAt = slaDueAt;
        this.status = status;
        this.statusDisplayName = statusDisplayName;
        this.completed = completed;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getSupportRequestId() {
        return supportRequestId;
    }

    public void setSupportRequestId(Long supportRequestId) {
        this.supportRequestId = supportRequestId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public SupportCategory getCategory() {
        return category;
    }

    public void setCategory(SupportCategory category) {
        this.category = category;
    }

    public String getCategoryDisplayName() {
        return categoryDisplayName;
    }

    public void setCategoryDisplayName(String categoryDisplayName) {
        this.categoryDisplayName = categoryDisplayName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public Boolean getIsUrgent() {
        return isUrgent;
    }

    public void setIsUrgent(Boolean isUrgent) {
        this.isUrgent = isUrgent;
    }

    public OffsetDateTime getSlaDueAt() {
        return slaDueAt;
    }

    public void setSlaDueAt(OffsetDateTime slaDueAt) {
        this.slaDueAt = slaDueAt;
    }

    public SupportStatus getStatus() {
        return status;
    }

    public void setStatus(SupportStatus status) {
        this.status = status;
    }

    public String getStatusDisplayName() {
        return statusDisplayName;
    }

    public void setStatusDisplayName(String statusDisplayName) {
        this.statusDisplayName = statusDisplayName;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class Builder {
        private Long supportRequestId;
        private String code;
        private SupportCategory category;
        private String categoryDisplayName;
        private String description;
        private Long storageUnitId;
        private String storageUnitCode;
        private Long facilityId;
        private String facilityName;
        private Long customerId;
        private String customerName;
        private String customerPhone;
        private OffsetDateTime createdAt;
        private Boolean isUrgent;
        private OffsetDateTime slaDueAt;
        private SupportStatus status;
        private String statusDisplayName;
        private boolean completed;

        public Builder supportRequestId(Long supportRequestId) {
            this.supportRequestId = supportRequestId;
            return this;
        }

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder category(SupportCategory category) {
            this.category = category;
            return this;
        }

        public Builder categoryDisplayName(String categoryDisplayName) {
            this.categoryDisplayName = categoryDisplayName;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
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

        public Builder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder isUrgent(Boolean isUrgent) {
            this.isUrgent = isUrgent;
            return this;
        }

        public Builder slaDueAt(OffsetDateTime slaDueAt) {
            this.slaDueAt = slaDueAt;
            return this;
        }

        public Builder status(SupportStatus status) {
            this.status = status;
            return this;
        }

        public Builder statusDisplayName(String statusDisplayName) {
            this.statusDisplayName = statusDisplayName;
            return this;
        }

        public Builder completed(boolean completed) {
            this.completed = completed;
            return this;
        }

        public DailySupportTaskDto build() {
            DailySupportTaskDto dto = new DailySupportTaskDto(supportRequestId, code, category, categoryDisplayName, description,
                    storageUnitId, storageUnitCode, facilityId, facilityName,
                    customerId, customerName, customerPhone,
                    isUrgent, slaDueAt, status, statusDisplayName, completed);
            dto.setCreatedAt(createdAt);
            return dto;
        }
    }
}
