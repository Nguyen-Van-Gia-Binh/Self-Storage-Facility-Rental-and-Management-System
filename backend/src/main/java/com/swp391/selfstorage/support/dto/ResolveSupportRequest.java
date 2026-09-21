package com.swp391.selfstorage.support.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(description = "Yêu cầu cập nhật kết quả xử lý sự cố tại chỗ của nhân viên (FS-05)")
public class ResolveSupportRequest {

    @NotBlank(message = "Nội dung ghi chú xử lý không được để trống")
    @Size(min = 5, max = 1000, message = "Nội dung xử lý phải từ 5 đến 1000 ký tự")
    @Schema(description = "Mô tả chi tiết giải pháp và kết quả xử lý sự cố", example = "Đã thay khóa cơ mới và bàn giao chìa khóa cho khách hàng")
    private String resolutionNote;

    @Size(max = 5, message = "Tối đa 5 ảnh đính kèm hiện trạng sau xử lý")
    @Schema(description = "Danh sách URL ảnh hiện trạng sau sửa chữa (tối đa 5 ảnh)", example = "[\"https://cdn.example.com/res1.jpg\"]")
    private List<String> resolutionAttachmentUrls;

    public ResolveSupportRequest() {
    }

    public ResolveSupportRequest(String resolutionNote, List<String> resolutionAttachmentUrls) {
        this.resolutionNote = resolutionNote;
        this.resolutionAttachmentUrls = resolutionAttachmentUrls;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }

    public List<String> getResolutionAttachmentUrls() {
        return resolutionAttachmentUrls;
    }

    public void setResolutionAttachmentUrls(List<String> resolutionAttachmentUrls) {
        this.resolutionAttachmentUrls = resolutionAttachmentUrls;
    }

    public static class Builder {
        private String resolutionNote;
        private List<String> resolutionAttachmentUrls;

        public Builder resolutionNote(String resolutionNote) {
            this.resolutionNote = resolutionNote;
            return this;
        }

        public Builder resolutionAttachmentUrls(List<String> resolutionAttachmentUrls) {
            this.resolutionAttachmentUrls = resolutionAttachmentUrls;
            return this;
        }

        public ResolveSupportRequest build() {
            return new ResolveSupportRequest(resolutionNote, resolutionAttachmentUrls);
        }
    }
}
