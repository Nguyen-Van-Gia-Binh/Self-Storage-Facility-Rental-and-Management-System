package com.swp391.selfstorage.user.controller;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.user.dto.CreateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRoleRequest;
import com.swp391.selfstorage.user.dto.UpdateUserStatusRequest;
import com.swp391.selfstorage.user.dto.UserResponse;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
@Tag(name = "User", description = "Quản lý tài khoản người dùng và phân quyền (SA-01, SA-02, SA-03)")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Lấy danh sách người dùng có phân trang và lọc (Admin)")
    public ResponseEntity<PageResponse<UserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(userService.getUsers(keyword, role, status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR') or #id == authentication.principal.id")
    @Operation(summary = "Lấy thông tin chi tiết một người dùng (Admin hoặc chính chủ)")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Tạo mới tài khoản nội bộ hoặc khách hàng (Admin)")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR') or #id == authentication.principal.id")
    @Operation(summary = "Cập nhật thông tin cá nhân của người dùng")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Gán vai trò và cơ sở làm việc cho người dùng (SA-02, SA-03)")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(userService.updateUserRole(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR')")
    @Operation(summary = "Kích hoạt hoặc vô hiệu hóa tài khoản người dùng (SA-01)")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(id, request));
    }

    @GetMapping("/{id}/facilities")
    @PreAuthorize("hasRole('SYSTEM_ADMINISTRATOR') or hasRole('BUSINESS_OPERATIONS_MANAGER') or #id == authentication.principal.id")
    @Operation(summary = "Lấy danh sách ID cơ sở mà người dùng được phân công (SA-03)")
    public ResponseEntity<List<Long>> getUserFacilities(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id).getFacilityIds());
    }
}
