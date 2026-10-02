package com.swp391.selfstorage.support.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.swp391.selfstorage.support.entity.SupportCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body tạo yêu cầu hỗ trợ mới (US-SC-06.1, POST /api/v1/support-requests).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CreateSupportRequest {

    private Long contractId;
    private Long storageUnitId;
    private Long facilityId;
    private String title;

    @NotNull(message = "Danh mục sự cố không được để trống")
    private SupportCategory category;

    @NotBlank(message = "Mô tả chi tiết sự cố không được để trống")
    @Size(min = 10, max = 1000, message = "Mô tả sự cố phải từ 10 đến 1000 ký tự")
    private String description;

    private Boolean isUrgent = false;

    @Size(max = 5, message = "Chỉ được đính kèm tối đa 5 hình ảnh minh chứng")
    private List<String> attachmentUrls;

    public CreateSupportRequest() {}

    public CreateSupportRequest(Long contractId, Long storageUnitId, String title,
                                SupportCategory category, String description,
                                Boolean isUrgent, List<String> attachmentUrls) {
        this.contractId = contractId;
        this.storageUnitId = storageUnitId;
        this.title = title;
        this.category = category;
        this.description = description;
        this.isUrgent = isUrgent != null ? isUrgent : false;
        this.attachmentUrls = attachmentUrls;
    }

    public CreateSupportRequest(Long contractId, Long storageUnitId, Long facilityId, String title,
                                SupportCategory category, String description,
                                Boolean isUrgent, List<String> attachmentUrls) {
        this.contractId = contractId;
        this.storageUnitId = storageUnitId;
        this.facilityId = facilityId;
        this.title = title;
        this.category = category;
        this.description = description;
        this.isUrgent = isUrgent != null ? isUrgent : false;
        this.attachmentUrls = attachmentUrls;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long contractId;
        private Long storageUnitId;
        private Long facilityId;
        private String title;
        private SupportCategory category;
        private String description;
        private Boolean isUrgent = false;
        private List<String> attachmentUrls;

        public Builder contractId(Long contractId) { this.contractId = contractId; return this; }
        public Builder storageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; return this; }
        public Builder facilityId(Long facilityId) { this.facilityId = facilityId; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder category(SupportCategory category) { this.category = category; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder isUrgent(Boolean isUrgent) { this.isUrgent = isUrgent; return this; }
        public Builder attachmentUrls(List<String> attachmentUrls) { this.attachmentUrls = attachmentUrls; return this; }

        public CreateSupportRequest build() {
            return new CreateSupportRequest(contractId, storageUnitId, facilityId, title, category, description, isUrgent, attachmentUrls);
        }
    }

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public SupportCategory getCategory() { return category; }
    public void setCategory(SupportCategory category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsUrgent() { return isUrgent; }
    public void setIsUrgent(Boolean isUrgent) { this.isUrgent = isUrgent; }

    public List<String> getAttachmentUrls() { return attachmentUrls; }
    public void setAttachmentUrls(List<String> attachmentUrls) { this.attachmentUrls = attachmentUrls; }
}
