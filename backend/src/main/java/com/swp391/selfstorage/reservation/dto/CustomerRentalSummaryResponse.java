package com.swp391.selfstorage.reservation.dto;

import java.time.LocalDate;

/**
 * DTO phản hồi danh sách ô kho đang thuê của khách hàng (US-SC-05.1, Task T4.1)
 * Hiển thị theo dạng thẻ trên giao diện My Rentals Dashboard.
 */
public class CustomerRentalSummaryResponse {

    private Long contractId;
    private String contractCode;
    private Long reservationId;
    private String reservationCode;

    // Thông tin cơ sở
    private Long facilityId;
    private String facilityName;
    private String facilityAddress;
    private String facilityPhone;

    // Thông tin ô kho
    private Long storageUnitId;
    private String storageUnitCode;
    private Integer floor;
    private String position;

    // Thông tin loại ô kho
    private Long unitTypeId;
    private String unitTypeName;
    private String unitDimensions;

    // Thời hạn và tài chính
    private LocalDate startDate;
    private LocalDate endDateExclusive;
    private int rentalMonths;
    private long monthlyPrice;
    private long depositAmount;
    private long depositBalance;
    private String status;

    // Cảnh báo & Đếm ngược
    private boolean nearExpiration;
    private long daysRemaining;

    // Kiểm soát truy cập kho (BR-OVD-01..03)
    private String accessCode;
    private boolean accessCodeLocked;

    // Thông tin quá hạn (nếu có)
    private long overdueDays;
    private long overdueFeeAccrued;
    private long totalOutstandingDebt;

    public CustomerRentalSummaryResponse() {}

    // Getters and Setters
    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public String getContractCode() { return contractCode; }
    public void setContractCode(String contractCode) { this.contractCode = contractCode; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public String getReservationCode() { return reservationCode; }
    public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getFacilityAddress() { return facilityAddress; }
    public void setFacilityAddress(String facilityAddress) { this.facilityAddress = facilityAddress; }

    public String getFacilityPhone() { return facilityPhone; }
    public void setFacilityPhone(String facilityPhone) { this.facilityPhone = facilityPhone; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public String getStorageUnitCode() { return storageUnitCode; }
    public void setStorageUnitCode(String storageUnitCode) { this.storageUnitCode = storageUnitCode; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public Long getUnitTypeId() { return unitTypeId; }
    public void setUnitTypeId(Long unitTypeId) { this.unitTypeId = unitTypeId; }

    public String getUnitTypeName() { return unitTypeName; }
    public void setUnitTypeName(String unitTypeName) { this.unitTypeName = unitTypeName; }

    public String getUnitDimensions() { return unitDimensions; }
    public void setUnitDimensions(String unitDimensions) { this.unitDimensions = unitDimensions; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDateExclusive() { return endDateExclusive; }
    public void setEndDateExclusive(LocalDate endDateExclusive) { this.endDateExclusive = endDateExclusive; }

    public int getRentalMonths() { return rentalMonths; }
    public void setRentalMonths(int rentalMonths) { this.rentalMonths = rentalMonths; }

    public long getMonthlyPrice() { return monthlyPrice; }
    public void setMonthlyPrice(long monthlyPrice) { this.monthlyPrice = monthlyPrice; }

    public long getDepositAmount() { return depositAmount; }
    public void setDepositAmount(long depositAmount) { this.depositAmount = depositAmount; }

    public long getDepositBalance() { return depositBalance; }
    public void setDepositBalance(long depositBalance) { this.depositBalance = depositBalance; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isNearExpiration() { return nearExpiration; }
    public void setNearExpiration(boolean nearExpiration) { this.nearExpiration = nearExpiration; }

    public long getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(long daysRemaining) { this.daysRemaining = daysRemaining; }

    public String getAccessCode() { return accessCode; }
    public void setAccessCode(String accessCode) { this.accessCode = accessCode; }

    public boolean isAccessCodeLocked() { return accessCodeLocked; }
    public void setAccessCodeLocked(boolean accessCodeLocked) { this.accessCodeLocked = accessCodeLocked; }

    public long getOverdueDays() { return overdueDays; }
    public void setOverdueDays(long overdueDays) { this.overdueDays = overdueDays; }

    public long getOverdueFeeAccrued() { return overdueFeeAccrued; }
    public void setOverdueFeeAccrued(long overdueFeeAccrued) { this.overdueFeeAccrued = overdueFeeAccrued; }

    public long getTotalOutstandingDebt() { return totalOutstandingDebt; }
    public void setTotalOutstandingDebt(long totalOutstandingDebt) { this.totalOutstandingDebt = totalOutstandingDebt; }
}
