package com.swp391.selfstorage.support.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

/**
 * Entity lưu trữ file/ảnh đính kèm đa hình (bảng attachment).
 */
@Entity
@Table(name = "attachment")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 30)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public Attachment() {}

    public Attachment(Long id, String entityType, Long entityId, String fileUrl, Long uploadedBy, OffsetDateTime createdAt) {
        this.id = id;
        this.entityType = entityType;
        this.entityId = entityId;
        this.fileUrl = fileUrl;
        this.uploadedBy = uploadedBy;
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String entityType;
        private Long entityId;
        private String fileUrl;
        private Long uploadedBy;
        private OffsetDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder entityType(String entityType) { this.entityType = entityType; return this; }
        public Builder entityId(Long entityId) { this.entityId = entityId; return this; }
        public Builder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public Builder uploadedBy(Long uploadedBy) { this.uploadedBy = uploadedBy; return this; }
        public Builder createdAt(OffsetDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Attachment build() {
            return new Attachment(id, entityType, entityId, fileUrl, uploadedBy, createdAt);
        }
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public Long getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(Long uploadedBy) { this.uploadedBy = uploadedBy; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
