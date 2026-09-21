package com.swp391.selfstorage.support.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body xác nhận nghiệm thu kết quả xử lý từ khách hàng (US-SC-06.3, PATCH /api/v1/support-requests/{id}/confirm hoặc /close).
 */
public class ConfirmResolutionRequest {

    private Boolean satisfied = true;

    @Size(max = 1000, message = "Nội dung phản hồi không được quá 1000 ký tự")
    private String feedback;

    @Size(max = 1000, message = "Nội dung phản hồi không được quá 1000 ký tự")
    private String customerFeedback;

    public ConfirmResolutionRequest() {}

    public ConfirmResolutionRequest(Boolean satisfied, String feedback, String customerFeedback) {
        this.satisfied = satisfied != null ? satisfied : true;
        this.feedback = feedback;
        this.customerFeedback = customerFeedback;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Boolean satisfied = true;
        private String feedback;
        private String customerFeedback;

        public Builder satisfied(Boolean satisfied) { this.satisfied = satisfied; return this; }
        public Builder feedback(String feedback) { this.feedback = feedback; return this; }
        public Builder customerFeedback(String customerFeedback) { this.customerFeedback = customerFeedback; return this; }

        public ConfirmResolutionRequest build() {
            return new ConfirmResolutionRequest(satisfied, feedback, customerFeedback);
        }
    }

    public String getEffectiveFeedback() {
        if (feedback != null && !feedback.isBlank()) {
            return feedback;
        }
        return customerFeedback;
    }

    public Boolean getSatisfied() { return satisfied; }
    public void setSatisfied(Boolean satisfied) { this.satisfied = satisfied; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public String getCustomerFeedback() { return customerFeedback; }
    public void setCustomerFeedback(String customerFeedback) { this.customerFeedback = customerFeedback; }
}
