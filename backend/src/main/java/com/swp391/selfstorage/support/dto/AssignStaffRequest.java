package com.swp391.selfstorage.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Yêu cầu phân công nhân viên xử lý sự cố (FM-05)")
public class AssignStaffRequest {

    @NotNull(message = "ID nhân viên không được để trống")
    @Schema(description = "ID của nhân viên cơ sở được phân công", example = "8")
    private Long staffId;

    @Size(max = 500, message = "Ghi chú phân công tối đa 500 ký tự")
    @Schema(description = "Ghi chú hoặc chỉ đạo từ Facility Manager", example = "Ưu tiên xử lý gấp sự cố kẹt cửa kho")
    private String note;

    public AssignStaffRequest() {
    }

    public AssignStaffRequest(Long staffId, String note) {
        this.staffId = staffId;
        this.note = note;
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

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public static class Builder {
        private Long staffId;
        private String note;

        public Builder staffId(Long staffId) {
            this.staffId = staffId;
            return this;
        }

        public Builder note(String note) {
            this.note = note;
            return this;
        }

        public AssignStaffRequest build() {
            return new AssignStaffRequest(staffId, note);
        }
    }
}
