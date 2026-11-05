package com.swp391.selfstorage.waitlist;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.waitlist.dto.ConvertWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.CreateWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.FollowUpWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.RejectWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.WaitlistResponse;
import com.swp391.selfstorage.waitlist.service.WaitlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Waitlist Telesales CRM", description = "Quản lý Danh sách chờ thuê kho theo mô hình Telesales CRM (Flow 1, BR-WAT-*)")
public class WaitlistController {

    private final WaitlistService waitlistService;

    @PostMapping("/waitlists")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Đăng ký vào Danh sách chờ", description = "Khách hàng đăng ký vào hàng đợi FIFO miễn phí khi loại kho hết chỗ (available = 0)")
    public ResponseEntity<ApiResponse<WaitlistResponse>> registerWaitlist(
            @Valid @RequestBody CreateWaitlistRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        WaitlistResponse response = waitlistService.registerWaitlist(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Đăng ký danh sách chờ thành công"));
    }

    @GetMapping("/waitlists/my")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem danh sách chờ của tôi", description = "Khách hàng tra cứu các đơn chờ thuê của tài khoản mình")
    public ResponseEntity<ApiResponse<List<WaitlistResponse>>> getMyWaitlists(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<WaitlistResponse> response = waitlistService.getMyWaitlists(currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/waitlists/{id}/extend")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Gia hạn thêm 15 ngày", description = "Khách hàng gia hạn thời gian chờ khi nhận email nhắc hẹn T-3 (BR-WAT-06)")
    public ResponseEntity<ApiResponse<WaitlistResponse>> extendWaitlist(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        WaitlistResponse response = waitlistService.extendWaitlist(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Gia hạn thời gian chờ thêm 15 ngày thành công"));
    }

    @DeleteMapping("/waitlists/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Hủy yêu cầu chờ", description = "Khách hàng chủ động hủy đơn chờ khi không còn nhu cầu")
    public ResponseEntity<ApiResponse<WaitlistResponse>> cancelWaitlist(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        WaitlistResponse response = waitlistService.cancelWaitlist(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Hủy yêu cầu chờ thành công"));
    }

    @GetMapping("/facilities/{facilityId}/waitlists")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER', 'SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Xem CRM Inbox Danh sách chờ của cơ sở", description = "FM xem danh sách khách chờ theo FIFO, tích hợp Available Capacity và countdown timer 2h")
    public ResponseEntity<ApiResponse<List<WaitlistResponse>>> getFacilityWaitlists(
            @PathVariable Long facilityId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<WaitlistResponse> response = waitlistService.getFacilityWaitlists(facilityId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/waitlists/{id}/start-contacting")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Bắt đầu tư vấn (Khóa độc quyền 2 giờ)", description = "FM nhận lead, hệ thống chuyển sang CONTACTING và khóa độc quyền 2 giờ chống tranh chấp")
    public ResponseEntity<ApiResponse<WaitlistResponse>> startContacting(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        WaitlistResponse response = waitlistService.startContacting(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã khóa cuộc gọi tư vấn thành công trong 2 giờ"));
    }

    @PostMapping("/waitlists/{id}/convert-to-reservation")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Chốt đơn cọc (Chuyển sang Reservation 24h)", description = "FM tạo đơn Reservation cho khách; kiểm tra dung lượng nghiêm ngặt (chặn nếu capacity = 0)")
    public ResponseEntity<ApiResponse<WaitlistResponse>> convertToReservation(
            @PathVariable Long id,
            @RequestBody(required = false) ConvertWaitlistRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        WaitlistResponse response = waitlistService.convertToReservation(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Chốt đơn thành công! Đã tạo đơn giữ cọc 24 giờ cho khách hàng"));
    }

    @PatchMapping("/waitlists/{id}/reject")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Ghi nhận khách từ chối", description = "FM cập nhật trạng thái đơn chờ sang REJECTED và lưu lý do")
    public ResponseEntity<ApiResponse<WaitlistResponse>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) RejectWaitlistRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        WaitlistResponse response = waitlistService.reject(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã ghi nhận khách hàng từ chối"));
    }

    @PatchMapping("/waitlists/{id}/follow-up")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'BUSINESS_OPERATIONS_MANAGER')")
    @Operation(summary = "Hẹn gọi lại sau / Khách bận", description = "FM lưu ghi chú cuộc gọi và chuyển sang PENDING_FOLLOW_UP, giải phóng khóa")
    public ResponseEntity<ApiResponse<WaitlistResponse>> followUp(
            @PathVariable Long id,
            @RequestBody(required = false) FollowUpWaitlistRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        WaitlistResponse response = waitlistService.followUp(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "Đã cập nhật lịch hẹn gọi lại"));
    }
}
