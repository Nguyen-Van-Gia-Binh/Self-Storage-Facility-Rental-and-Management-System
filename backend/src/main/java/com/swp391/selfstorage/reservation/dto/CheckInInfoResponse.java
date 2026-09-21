package com.swp391.selfstorage.reservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.util.List;

/**
 * Thông tin chi tiết lịch hẹn check-in và hướng dẫn nhận kho của khách hàng (US-SC-04.1).
 */
@Schema(description = "Thông tin chi tiết lịch hẹn Check-in nhận kho")
public class CheckInInfoResponse {

    @Schema(description = "ID đơn đặt chỗ", example = "1042")
    private Long reservationId;

    @Schema(description = "Mã đơn đặt chỗ", example = "RSV-2026-001042")
    private String reservationCode;

    @Schema(description = "ID hợp đồng thuê liên quan", example = "500")
    private Long contractId;

    @Schema(description = "Mã hợp đồng thuê", example = "CTR-202610-001")
    private String contractCode;

    @Schema(description = "Trạng thái đơn đặt chỗ", example = "CONFIRMED")
    private String status;

    @Schema(description = "Ngày bắt đầu kỳ thuê", example = "2026-10-01")
    private LocalDate startDate;

    @Schema(description = "Hạn chót check-in (10 ngày ân hạn theo BR-CAN-04)", example = "2026-10-11")
    private LocalDate gracePeriodEnd;

    @Schema(description = "Số ngày còn lại trước khi hết hạn check-in", example = "5")
    private long daysRemaining;

    @Schema(description = "ID cơ sở", example = "1")
    private Long facilityId;

    @Schema(description = "Tên cơ sở", example = "Kho Tự Quản Quận 7")
    private String facilityName;

    @Schema(description = "Địa chỉ cơ sở", example = "123 Nguyễn Thị Thập, Tân Phú, Quận 7, TP.HCM")
    private String facilityAddress;

    @Schema(description = "Hotline cơ sở", example = "028 1234 5678")
    private String facilityPhone;

    @Schema(description = "Giờ mở cửa cơ sở", example = "07:00 - 21:00 hàng ngày")
    private String openingHours;

    @Schema(description = "ID ô kho vật lý", example = "42")
    private Long storageUnitId;

    @Schema(description = "Mã ô kho vật lý", example = "S-101")
    private String storageUnitCode;

    @Schema(description = "Tên loại ô kho", example = "Loại S — 3m²")
    private String unitTypeName;

    @Schema(description = "Kích thước ô kho", example = "1.5m x 2.0m x 2.5m")
    private String unitDimensions;

    @Schema(description = "Tầng", example = "1")
    private Integer floor;

    @Schema(description = "Vị trí", example = "Dãy A")
    private String position;

    @Schema(description = "Mã QR Check-in rút gọn để nhân viên quét", example = "CHK-RSV2026001042-500")
    private String checkinToken;

    @Schema(description = "Danh sách giấy tờ cần mang")
    private List<String> requiredDocuments;

    @Schema(description = "Lưu ý quan trọng")
    private String notes;

    public CheckInInfoResponse() {}

    // Getters and Setters
    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public String getReservationCode() { return reservationCode; }
    public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public String getContractCode() { return contractCode; }
    public void setContractCode(String contractCode) { this.contractCode = contractCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getGracePeriodEnd() { return gracePeriodEnd; }
    public void setGracePeriodEnd(LocalDate gracePeriodEnd) { this.gracePeriodEnd = gracePeriodEnd; }

    public long getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(long daysRemaining) { this.daysRemaining = daysRemaining; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getFacilityAddress() { return facilityAddress; }
    public void setFacilityAddress(String facilityAddress) { this.facilityAddress = facilityAddress; }

    public String getFacilityPhone() { return facilityPhone; }
    public void setFacilityPhone(String facilityPhone) { this.facilityPhone = facilityPhone; }

    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public String getStorageUnitCode() { return storageUnitCode; }
    public void setStorageUnitCode(String storageUnitCode) { this.storageUnitCode = storageUnitCode; }

    public String getUnitTypeName() { return unitTypeName; }
    public void setUnitTypeName(String unitTypeName) { this.unitTypeName = unitTypeName; }

    public String getUnitDimensions() { return unitDimensions; }
    public void setUnitDimensions(String unitDimensions) { this.unitDimensions = unitDimensions; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getCheckinToken() { return checkinToken; }
    public void setCheckinToken(String checkinToken) { this.checkinToken = checkinToken; }

    public List<String> getRequiredDocuments() { return requiredDocuments; }
    public void setRequiredDocuments(List<String> requiredDocuments) { this.requiredDocuments = requiredDocuments; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
