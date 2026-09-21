package com.swp391.selfstorage.support.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Schema(description = "Bảng công việc ca trực hằng ngày của nhân viên (FS-06, US-FS-06.1, API-SPEC § 12)")
public class StaffDailyTasksResponse {

    @Schema(description = "Ngày trực")
    private LocalDate date;

    @Schema(description = "ID nhân viên")
    private Long staffId;

    @Schema(description = "Tên nhân viên")
    private String staffName;

    @Schema(description = "ID cơ sở làm việc chính")
    private Long facilityId;

    @Schema(description = "Tên cơ sở làm việc")
    private String facilityName;

    @Schema(description = "Thống kê tổng hợp số lượng việc trong ca")
    private DailyTasksSummaryDto summary;

    @Schema(description = "Danh sách nhiệm vụ đón khách nhận kho (Check-in)")
    private List<DailyCheckInTaskDto> checkInTasks = new ArrayList<>();

    @Schema(description = "Danh sách nhiệm vụ kiểm tra và trả kho (Return / Inspection)")
    private List<DailyReturnTaskDto> returnTasks = new ArrayList<>();

    @Schema(description = "Danh sách sự cố và hỗ trợ kỹ thuật (Support / Overlock)")
    private List<DailySupportTaskDto> supportTasks = new ArrayList<>();

    public StaffDailyTasksResponse() {
    }

    public StaffDailyTasksResponse(LocalDate date, Long staffId, String staffName,
                                   Long facilityId, String facilityName,
                                   DailyTasksSummaryDto summary,
                                   List<DailyCheckInTaskDto> checkInTasks,
                                   List<DailyReturnTaskDto> returnTasks,
                                   List<DailySupportTaskDto> supportTasks) {
        this.date = date;
        this.staffId = staffId;
        this.staffName = staffName;
        this.facilityId = facilityId;
        this.facilityName = facilityName;
        this.summary = summary;
        this.checkInTasks = checkInTasks != null ? checkInTasks : new ArrayList<>();
        this.returnTasks = returnTasks != null ? returnTasks : new ArrayList<>();
        this.supportTasks = supportTasks != null ? supportTasks : new ArrayList<>();
    }

    public static Builder builder() {
        return new Builder();
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
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

    public DailyTasksSummaryDto getSummary() {
        return summary;
    }

    public void setSummary(DailyTasksSummaryDto summary) {
        this.summary = summary;
    }

    public List<DailyCheckInTaskDto> getCheckInTasks() {
        return checkInTasks;
    }

    public void setCheckInTasks(List<DailyCheckInTaskDto> checkInTasks) {
        this.checkInTasks = checkInTasks != null ? checkInTasks : new ArrayList<>();
    }

    public List<DailyReturnTaskDto> getReturnTasks() {
        return returnTasks;
    }

    public void setReturnTasks(List<DailyReturnTaskDto> returnTasks) {
        this.returnTasks = returnTasks != null ? returnTasks : new ArrayList<>();
    }

    public List<DailySupportTaskDto> getSupportTasks() {
        return supportTasks;
    }

    public void setSupportTasks(List<DailySupportTaskDto> supportTasks) {
        this.supportTasks = supportTasks != null ? supportTasks : new ArrayList<>();
    }

    // --- API-SPEC § 12 compatibility aliases ---

    @JsonProperty("pendingCheckIns")
    public List<DailyCheckInTaskDto> getPendingCheckIns() {
        return checkInTasks;
    }

    @JsonProperty("pendingReturns")
    public List<DailyReturnTaskDto> getPendingReturns() {
        return returnTasks;
    }

    @JsonProperty("openSupportRequests")
    public List<DailySupportTaskDto> getOpenSupportRequests() {
        return supportTasks;
    }

    public static class Builder {
        private LocalDate date;
        private Long staffId;
        private String staffName;
        private Long facilityId;
        private String facilityName;
        private DailyTasksSummaryDto summary;
        private List<DailyCheckInTaskDto> checkInTasks = new ArrayList<>();
        private List<DailyReturnTaskDto> returnTasks = new ArrayList<>();
        private List<DailySupportTaskDto> supportTasks = new ArrayList<>();

        public Builder date(LocalDate date) {
            this.date = date;
            return this;
        }

        public Builder staffId(Long staffId) {
            this.staffId = staffId;
            return this;
        }

        public Builder staffName(String staffName) {
            this.staffName = staffName;
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

        public Builder summary(DailyTasksSummaryDto summary) {
            this.summary = summary;
            return this;
        }

        public Builder checkInTasks(List<DailyCheckInTaskDto> checkInTasks) {
            this.checkInTasks = checkInTasks;
            return this;
        }

        public Builder returnTasks(List<DailyReturnTaskDto> returnTasks) {
            this.returnTasks = returnTasks;
            return this;
        }

        public Builder supportTasks(List<DailySupportTaskDto> supportTasks) {
            this.supportTasks = supportTasks;
            return this;
        }

        public StaffDailyTasksResponse build() {
            return new StaffDailyTasksResponse(date, staffId, staffName, facilityId, facilityName,
                    summary, checkInTasks, returnTasks, supportTasks);
        }
    }
}
