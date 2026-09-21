package com.swp391.selfstorage.support.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Entity lưu vết phân công công việc hằng ngày của nhân viên cơ sở (bảng staff_daily_assignment - FM-05, FS-05, FS-06).
 */
@Entity
@Table(name = "staff_daily_assignment")
public class StaffDailyAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_id", nullable = false)
    private Long staffId;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 20)
    private AssignmentTaskType taskType;

    @Column(name = "reference_type", nullable = false, length = 30)
    private String referenceType;

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "assigned_by", nullable = false)
    private Long assignedBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public StaffDailyAssignment() {
    }

    public StaffDailyAssignment(Long id, Long staffId, Long facilityId, LocalDate workDate,
                                AssignmentTaskType taskType, String referenceType, Long referenceId,
                                Long assignedBy, OffsetDateTime createdAt) {
        this.id = id;
        this.staffId = staffId;
        this.facilityId = facilityId;
        this.workDate = workDate;
        this.taskType = taskType;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.assignedBy = assignedBy;
        this.createdAt = createdAt != null ? createdAt : OffsetDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public Long getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Long facilityId) {
        this.facilityId = facilityId;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }

    public AssignmentTaskType getTaskType() {
        return taskType;
    }

    public void setTaskType(AssignmentTaskType taskType) {
        this.taskType = taskType;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public Long getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(Long assignedBy) {
        this.assignedBy = assignedBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static class Builder {
        private Long id;
        private Long staffId;
        private Long facilityId;
        private LocalDate workDate;
        private AssignmentTaskType taskType;
        private String referenceType;
        private Long referenceId;
        private Long assignedBy;
        private OffsetDateTime createdAt;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder staffId(Long staffId) {
            this.staffId = staffId;
            return this;
        }

        public Builder facilityId(Long facilityId) {
            this.facilityId = facilityId;
            return this;
        }

        public Builder workDate(LocalDate workDate) {
            this.workDate = workDate;
            return this;
        }

        public Builder taskType(AssignmentTaskType taskType) {
            this.taskType = taskType;
            return this;
        }

        public Builder referenceType(String referenceType) {
            this.referenceType = referenceType;
            return this;
        }

        public Builder referenceId(Long referenceId) {
            this.referenceId = referenceId;
            return this;
        }

        public Builder assignedBy(Long assignedBy) {
            this.assignedBy = assignedBy;
            return this;
        }

        public Builder createdAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public StaffDailyAssignment build() {
            return new StaffDailyAssignment(id, staffId, facilityId, workDate, taskType, referenceType, referenceId, assignedBy, createdAt);
        }
    }
}
