package com.swp391.selfstorage.user.controller;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.user.dto.AuditLogFilterRequest;
import com.swp391.selfstorage.user.dto.AuditLogResponse;
import com.swp391.selfstorage.user.dto.LoginHistoryFilterRequest;
import com.swp391.selfstorage.user.dto.LoginHistoryResponse;
import com.swp391.selfstorage.user.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/audit")
@RequiredArgsConstructor
@Tag(name = "Audit Log", description = "Quản lý nhật ký kiểm toán và lịch sử đăng nhập (SA-04)")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/logins")
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem lịch sử đăng nhập hệ thống có lọc và phân trang (SA-04, Admin)")
    public ResponseEntity<PageResponse<LoginHistoryResponse>> getLoginHistories(
            @ModelAttribute LoginHistoryFilterRequest filter,
            @PageableDefault(size = 20, sort = "loggedInAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditLogService.getLoginHistories(filter, pageable));
    }

    @GetMapping("/activities")
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem toàn bộ nhật ký hoạt động hệ thống có lọc và phân trang (SA-04, Admin)")
    public ResponseEntity<PageResponse<AuditLogResponse>> getAuditLogs(
            @ModelAttribute AuditLogFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditLogService.getAuditLogs(filter, pageable));
    }

    @GetMapping("/activities/export")
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xuất nhật ký hoạt động ra file CSV (SA-04, Admin)")
    public ResponseEntity<byte[]> exportAuditLogsCsv(@ModelAttribute AuditLogFilterRequest filter) {
        byte[] csvBytes = auditLogService.exportAuditLogsCsv(filter);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", "audit_logs_" + LocalDate.now() + ".csv");
        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }
}
