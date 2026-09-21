package com.swp391.selfstorage.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Thống kê tổng quan công việc ca trực hằng ngày của Staff")
public class DailyTasksSummaryDto {

    @Schema(description = "Tổng số lượng nhiệm vụ trong ngày")
    private int totalTasks;

    @Schema(description = "Số nhiệm vụ đang chờ xử lý / tồn đọng")
    private int pendingTasks;

    @Schema(description = "Số nhiệm vụ đã hoàn thành")
    private int completedTasks;

    @Schema(description = "Số nhiệm vụ khẩn cấp")
    private int urgentTasks;

    @Schema(description = "Số lượng khách hẹn check-in")
    private int checkInCount;

    @Schema(description = "Số lượng khách hẹn trả kho / kiểm tra")
    private int returnCount;

    @Schema(description = "Số lượng yêu cầu hỗ trợ / sự cố")
    private int supportCount;

    public DailyTasksSummaryDto() {
    }

    public DailyTasksSummaryDto(int totalTasks, int pendingTasks, int completedTasks, int urgentTasks,
                                int checkInCount, int returnCount, int supportCount) {
        this.totalTasks = totalTasks;
        this.pendingTasks = pendingTasks;
        this.completedTasks = completedTasks;
        this.urgentTasks = urgentTasks;
        this.checkInCount = checkInCount;
        this.returnCount = returnCount;
        this.supportCount = supportCount;
    }

    public static Builder builder() {
        return new Builder();
    }

    public int getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(int totalTasks) {
        this.totalTasks = totalTasks;
    }

    public int getPendingTasks() {
        return pendingTasks;
    }

    public void setPendingTasks(int pendingTasks) {
        this.pendingTasks = pendingTasks;
    }

    public int getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(int completedTasks) {
        this.completedTasks = completedTasks;
    }

    public int getUrgentTasks() {
        return urgentTasks;
    }

    public void setUrgentTasks(int urgentTasks) {
        this.urgentTasks = urgentTasks;
    }

    public int getCheckInCount() {
        return checkInCount;
    }

    public void setCheckInCount(int checkInCount) {
        this.checkInCount = checkInCount;
    }

    public int getReturnCount() {
        return returnCount;
    }

    public void setReturnCount(int returnCount) {
        this.returnCount = returnCount;
    }

    public int getSupportCount() {
        return supportCount;
    }

    public void setSupportCount(int supportCount) {
        this.supportCount = supportCount;
    }

    public static class Builder {
        private int totalTasks;
        private int pendingTasks;
        private int completedTasks;
        private int urgentTasks;
        private int checkInCount;
        private int returnCount;
        private int supportCount;

        public Builder totalTasks(int totalTasks) {
            this.totalTasks = totalTasks;
            return this;
        }

        public Builder pendingTasks(int pendingTasks) {
            this.pendingTasks = pendingTasks;
            return this;
        }

        public Builder completedTasks(int completedTasks) {
            this.completedTasks = completedTasks;
            return this;
        }

        public Builder urgentTasks(int urgentTasks) {
            this.urgentTasks = urgentTasks;
            return this;
        }

        public Builder checkInCount(int checkInCount) {
            this.checkInCount = checkInCount;
            return this;
        }

        public Builder returnCount(int returnCount) {
            this.returnCount = returnCount;
            return this;
        }

        public Builder supportCount(int supportCount) {
            this.supportCount = supportCount;
            return this;
        }

        public DailyTasksSummaryDto build() {
            return new DailyTasksSummaryDto(totalTasks, pendingTasks, completedTasks, urgentTasks,
                    checkInCount, returnCount, supportCount);
        }
    }
}
