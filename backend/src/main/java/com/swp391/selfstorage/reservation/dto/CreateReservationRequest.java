package com.swp391.selfstorage.reservation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Yêu cầu tạo đơn đặt chỗ từ Customer Portal.
 * Bắt buộc nhập thông tin CCCD định danh theo BR-CHK-01.
 */
public class CreateReservationRequest {

    @NotNull(message = "Mã cơ sở không được để trống")
    private Long facilityId;

    @NotNull(message = "Loại ô kho không được để trống")
    private Long unitTypeId;

    private Long storageUnitId; // Ô kho cụ thể khách chọn trên sơ đồ (BR-AVL-04)

    @NotNull(message = "Ngày bắt đầu không được để trống")
    @FutureOrPresent(message = "Ngày bắt đầu thuê không được ở trong quá khứ")
    private LocalDate startDate;

    @Min(value = 1, message = "Thời hạn thuê tối thiểu là 1 tháng")
    private int rentalMonths = 3;

    @NotBlank(message = "Họ và tên khách hàng không được để trống")
    private String customerName;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String customerPhone;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    private String customerEmail;

    @NotBlank(message = "Số CCCD / Hộ chiếu không được để trống theo BR-CHK-01")
    @Size(min = 9, max = 20, message = "Số CCCD / Hộ chiếu phải từ 9 đến 20 ký tự")
    private String identityNumber;

    public CreateReservationRequest() {}

    // Getters and Setters
    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public Long getUnitTypeId() { return unitTypeId; }
    public void setUnitTypeId(Long unitTypeId) { this.unitTypeId = unitTypeId; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public int getRentalMonths() { return rentalMonths; }
    public void setRentalMonths(int rentalMonths) { this.rentalMonths = rentalMonths; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getIdentityNumber() { return identityNumber; }
    public void setIdentityNumber(String identityNumber) { this.identityNumber = identityNumber; }
}
