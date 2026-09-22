package com.swp391.selfstorage.user.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.user.dto.AuditLogFilterRequest;
import com.swp391.selfstorage.user.dto.AuditLogResponse;
import com.swp391.selfstorage.user.dto.LoginHistoryFilterRequest;
import com.swp391.selfstorage.user.dto.LoginHistoryResponse;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {

    /**
     * Ghi nhận một lần đăng nhập (thành công hoặc thất bại) - US-SA-04.1
     */
    void recordLogin(Long userId, String email, String ipAddress, String userAgent, boolean isSuccess, String failureReason);

    /**
     * Lấy danh sách lịch sử đăng nhập có phân trang và lọc (Admin) - US-SA-04.1
     */
    PageResponse<LoginHistoryResponse> getLoginHistories(LoginHistoryFilterRequest filter, Pageable pageable);

    /**
     * Ghi nhận một thao tác nghiệp vụ quan trọng - US-SA-04.2
     */
    void logAction(Long userId, String action, String entityType, Long entityId, String beforeValue, String afterValue);

    /**
     * Lấy danh sách nhật ký hoạt động có phân trang và lọc (Admin) - US-SA-04.2
     */
    PageResponse<AuditLogResponse> getAuditLogs(AuditLogFilterRequest filter, Pageable pageable);

    /**
     * Lấy nhật ký hoạt động của riêng một người dùng (Admin hoặc chính user) - API-SPEC line 416
     */
    PageResponse<AuditLogResponse> getUserActivityLogs(Long targetUserId, AuditLogFilterRequest filter, Pageable pageable, UserPrincipal currentUser);

    /**
     * Xuất nhật ký hoạt động ra file CSV, làm sạch mật khẩu / access code - US-SA-04.2 AC-3
     */
    byte[] exportAuditLogsCsv(AuditLogFilterRequest filter);
}
