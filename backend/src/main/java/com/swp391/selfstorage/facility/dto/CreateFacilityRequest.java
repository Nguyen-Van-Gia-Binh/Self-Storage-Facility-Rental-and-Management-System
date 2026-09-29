package com.swp391.selfstorage.facility.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateFacilityRequest {

    @NotBlank(message = "Mã cơ sở không được để trống")
    @Size(min = 6, max = 8, message = "Mã cơ sở phải có dạng FAC- và 2–4 ký tự, bắt đầu bằng chữ (ví dụ FAC-Q7, FAC-CG)")
    @Pattern(regexp = "(?i)^FAC-[A-Z][A-Z0-9]{1,3}$", message = "Mã cơ sở phải có dạng FAC- và 2–4 ký tự, bắt đầu bằng chữ (ví dụ FAC-Q7, FAC-CG)")
    private String code;

    @NotBlank(message = "Tên cơ sở không được để trống")
    @Size(min = 2, max = 150, message = "Tên cơ sở phải từ 2 đến 150 ký tự")
    private String name;

    @NotBlank(message = "Địa chỉ cơ sở không được để trống")
    @Size(min = 5, max = 255, message = "Địa chỉ phải từ 5 đến 255 ký tự")
    private String address;

    @Pattern(regexp = "^0\\d{9}$", message = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0")
    private String phone;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;

    @Pattern(regexp = "^(?:[01]\\d|2[0-3]):[0-5]\\d[–-](?:[01]\\d|2[0-3]):[0-5]\\d$", message = "Giờ hoạt động phải có dạng HH:mm–HH:mm")
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
