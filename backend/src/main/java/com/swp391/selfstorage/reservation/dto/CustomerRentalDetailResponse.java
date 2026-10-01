package com.swp391.selfstorage.reservation.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * DTO phản hồi thông tin chi tiết một hợp đồng ô kho của khách hàng (US-SC-05.2, Task T4.1)
 */
public class CustomerRentalDetailResponse extends CustomerRentalSummaryResponse {

    private OffsetDateTime createdAt;
    private LocalDate checkinDate;
    private LocalDate returnDate;
    private OffsetDateTime closedAt;
    private long totalRentalFee;
    private String policySnapshot;
    private String instructionNotes;
    private List<String> allowedActions;

    public CustomerRentalDetailResponse() {
        super();
    }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDate getCheckinDate() { return checkinDate; }
    public void setCheckinDate(LocalDate checkinDate) { this.checkinDate = checkinDate; }

    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }

    public OffsetDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(OffsetDateTime closedAt) { this.closedAt = closedAt; }

    public long getTotalRentalFee() { return totalRentalFee; }
    public void setTotalRentalFee(long totalRentalFee) { this.totalRentalFee = totalRentalFee; }

    public String getPolicySnapshot() { return policySnapshot; }
    public void setPolicySnapshot(String policySnapshot) { this.policySnapshot = policySnapshot; }

    public String getInstructionNotes() { return instructionNotes; }
    public void setInstructionNotes(String instructionNotes) { this.instructionNotes = instructionNotes; }

    public List<String> getAllowedActions() { return allowedActions; }
    public void setAllowedActions(List<String> allowedActions) { this.allowedActions = allowedActions; }

    // Thông tin khách hàng phục vụ hiển thị hợp đồng điện tử
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String customerIdentityNumber;

    // Thông tin biên bản bàn giao (Handover Record)
    private String handoverStaffName;
    private String handoverConditionNote;
    private OffsetDateTime customerConfirmedAt;

    // Thông tin phụ lục điều chuyển ô kho (Relocation)
    private Long relocationSupportRequestId;
    private String relocationSupportRequestCode;
    private String relocationReason;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerIdentityNumber() { return customerIdentityNumber; }
    public void setCustomerIdentityNumber(String customerIdentityNumber) { this.customerIdentityNumber = customerIdentityNumber; }

    public String getHandoverStaffName() { return handoverStaffName; }
    public void setHandoverStaffName(String handoverStaffName) { this.handoverStaffName = handoverStaffName; }

    public String getHandoverConditionNote() { return handoverConditionNote; }
    public void setHandoverConditionNote(String handoverConditionNote) { this.handoverConditionNote = handoverConditionNote; }

    public OffsetDateTime getCustomerConfirmedAt() { return customerConfirmedAt; }
    public void setCustomerConfirmedAt(OffsetDateTime customerConfirmedAt) { this.customerConfirmedAt = customerConfirmedAt; }

    public Long getRelocationSupportRequestId() { return relocationSupportRequestId; }
    public void setRelocationSupportRequestId(Long relocationSupportRequestId) { this.relocationSupportRequestId = relocationSupportRequestId; }

    public String getRelocationSupportRequestCode() { return relocationSupportRequestCode; }
    public void setRelocationSupportRequestCode(String relocationSupportRequestCode) { this.relocationSupportRequestCode = relocationSupportRequestCode; }

    public String getRelocationReason() { return relocationReason; }
    public void setRelocationReason(String relocationReason) { this.relocationReason = relocationReason; }
}
