package com.swp391.selfstorage.auth.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.user.entity.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Service kiểm tra phân quyền truy cập dữ liệu theo cơ sở (SA-03, T2.6).
 * Dùng trực tiếp trong SpEL: @PreAuthorize("@facilitySecurity.canAccessFacility(#facilityId)")
 * Hoặc gọi trực tiếp trong code Service: facilitySecurity.validateFacilityAccess(facilityId).
 */
@Component("facilitySecurity")
public class FacilitySecurityService {

    public boolean canAccessFacility(Long facilityId) {
        if (facilityId == null) {
            return false;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal userPrincipal)) {
            return false;
        }

        UserRole role = userPrincipal.getRole();

        // 1. Quản trị viên và Quản lý vận hành có quyền truy cập toàn bộ các cơ sở
        if (role == UserRole.SYSTEM_ADMINISTRATOR || role == UserRole.BUSINESS_OPERATIONS_MANAGER) {
            return true;
        }

        // 2. Nhân viên và Quản lý cơ sở chỉ có quyền trên các cơ sở được phân công (SA-03)
        if (role == UserRole.FACILITY_STAFF || role == UserRole.FACILITY_MANAGER) {
            List<Long> assignedFacilityIds = userPrincipal.getFacilityIds();
            return assignedFacilityIds != null && assignedFacilityIds.contains(facilityId);
        }

        // 3. Khách hàng thông thường không có quyền quản lý cơ sở
        return false;
    }

    public void validateFacilityAccess(Long facilityId) {
        if (!canAccessFacility(facilityId)) {
            throw new CustomException(ErrorCode.FACILITY_ACCESS_DENIED);
        }
    }

    public boolean isGlobalManagerOrAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            UserRole role = userPrincipal.getRole();
            return role == UserRole.SYSTEM_ADMINISTRATOR || role == UserRole.BUSINESS_OPERATIONS_MANAGER;
        }
        return false;
    }
}
