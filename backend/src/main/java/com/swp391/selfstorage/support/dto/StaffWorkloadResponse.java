package com.swp391.selfstorage.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Thông tin khối lượng công việc của nhân viên cơ sở (FM-05, US-FM-05.1 AC-3)")
public class StaffWorkloadResponse {

    @Schema(description = "ID nhân viên")
    private Long staffId;

    @Schema(description = "Họ và tên nhân viên")
    private String staffName;

    @Schema(description = "Email nhân viên")
    private String staffEmail;

    @Schema(description = "Số điện thoại nhân viên")
    private String staffPhone;

    @Schema(description = "ID cơ sở làm việc")
    private Long facilityId;

    @Schema(description = "Tên cơ sở làm việc")
    private String facilityName;

    @Schema(description = "Số lượng nhiệm vụ đang xử lý / chưa hoàn thành")
    private long activeTaskCount;

    @Schema(description = "Số lượng nhiệm vụ đã hoàn thành")
    private long completedTaskCount;

    public StaffWorkloadResponse() {
    }

    public StaffWorkloadResponse(Long staffId, String staffName, String staffEmail, String staffPhone,
                                 Long facilityId, String facilityName, long activeTaskCount, long completedTaskCount) {
        this.staffId = staffId;
        this.staffName = staffName;
        this.staffEmail = staffEmail;
        this.staffPhone = staffPhone;
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.activeTaskCount = activeTaskCount;
        this.completedTaskCount = completedTaskCount;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getStaffId() {
        return staffId;
    }

    public void setStaffId(Long staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public String getStaffEmail() {
        return staffEmail;
    }

    public void setStaffEmail(String staffEmail) {
        this.staffEmail = staffEmail;
    }

    public String getStaffPhone() {
        return staffPhone;
    }

    public void setStaffPhone(String staffPhone) {
        this.staffPhone = staffPhone;
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

    public long getActiveTaskCount() {
        return activeTaskCount;
    }

    public void setActiveTaskCount(long activeTaskCount) {
        this.activeTaskCount = activeTaskCount;
    }

    public long getCompletedTaskCount() {
        return completedTaskCount;
    }

    public void setCompletedTaskCount(long completedTaskCount) {
        this.completedTaskCount = completedTaskCount;
    }

    public static class Builder {
        private Long staffId;
        private String staffName;
        private String staffEmail;
        private String staffPhone;
        private Long facilityId;
        private String facilityName;
        private long activeTaskCount;
        private long completedTaskCount;

        public Builder staffId(Long staffId) {
            this.staffId = staffId;
            return this;
        }

        public Builder staffName(String staffName) {
            this.staffName = staffName;
            return this;
        }

        public Builder staffEmail(String staffEmail) {
            this.staffEmail = staffEmail;
            return this;
        }

        public Builder staffPhone(String staffPhone) {
            this.staffPhone = staffPhone;
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

        public Builder activeTaskCount(long activeTaskCount) {
            this.activeTaskCount = activeTaskCount;
            return this;
        }

        public Builder completedTaskCount(long completedTaskCount) {
            this.completedTaskCount = completedTaskCount;
            return this;
        }

        public StaffWorkloadResponse build() {
            return new StaffWorkloadResponse(staffId, staffName, staffEmail, staffPhone, facilityId, facilityName, activeTaskCount, completedTaskCount);
        }
    }
}
