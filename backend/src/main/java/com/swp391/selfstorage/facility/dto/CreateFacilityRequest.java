package com.swp391.selfstorage.facility.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateFacilityRequest {

    @NotBlank(message = "Mã cơ sở không được để trống")
    @Size(min = 2, max = 20, message = "Mã cơ sở phải từ 2 đến 20 ký tự")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Mã cơ sở chỉ chứa chữ cái, số, gạch nối hoặc gạch dưới")
    private String code;

    @NotBlank(message = "Tên cơ sở không được để trống")
    @Size(min = 2, max = 150, message = "Tên cơ sở phải từ 2 đến 150 ký tự")
    private String name;

    @NotBlank(message = "Địa chỉ cơ sở không được để trống")
    @Size(min = 5, max = 255, message = "Địa chỉ phải từ 5 đến 255 ký tự")
    private String address;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;

    @Size(max = 50, message = "Giờ mở cửa tối đa 50 ký tự")
    private String openingHours;

    public CreateFacilityRequest() {}

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }
}
