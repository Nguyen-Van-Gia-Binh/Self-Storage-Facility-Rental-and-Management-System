package com.swp391.selfstorage.user.dto;

import com.swp391.selfstorage.user.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class CreateUserRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 150, message = "Họ và tên phải từ 2 đến 150 ký tự")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private String phone;

    private String identityNumber;

    @NotNull(message = "Vai trò không được để trống")
    private UserRole role;

    private List<Long> facilityIds = new ArrayList<>();

    @Size(min = 8, message = "Mật khẩu phải có tối thiểu 8 ký tự")
    private String password;

    public CreateUserRequest() {}

    public CreateUserRequest(String fullName, String email, String phone, String identityNumber,
                             UserRole role, List<Long> facilityIds, String password) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.identityNumber = identityNumber;
        this.role = role;
        this.facilityIds = (facilityIds != null) ? facilityIds : new ArrayList<>();
        this.password = password;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getIdentityNumber() { return identityNumber; }
    public void setIdentityNumber(String identityNumber) { this.identityNumber = identityNumber; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public List<Long> getFacilityIds() { return facilityIds; }
    public void setFacilityIds(List<Long> facilityIds) { this.facilityIds = facilityIds; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
