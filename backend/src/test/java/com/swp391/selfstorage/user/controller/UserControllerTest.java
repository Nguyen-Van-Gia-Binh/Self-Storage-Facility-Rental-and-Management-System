package com.swp391.selfstorage.user.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.user.dto.CreateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRoleRequest;
import com.swp391.selfstorage.user.dto.UpdateUserStatusRequest;
import com.swp391.selfstorage.user.dto.UserResponse;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private com.swp391.selfstorage.user.service.AuditLogService auditLogService;

    @Test
    @DisplayName("GET /users trả về danh sách phân trang 200 OK")
    void testGetUsers() throws Exception {
        UserResponse response = UserResponse.builder()
                .id(1L)
                .email("admin@example.com")
                .fullName("Quản trị viên")
                .role(UserRole.SYSTEM_ADMINISTRATOR)
                .status(UserStatus.ACTIVE)
                .active(true)
                .facilityIds(List.of())
                .build();

        PageResponse<UserResponse> page = new PageResponse<>(List.of(response), 0, 20, 1, 1);
        when(userService.getUsers(any(), any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("admin@example.com"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /users/{id} trả về thông tin chi tiết 200 OK")
    void testGetUserById() throws Exception {
        UserResponse response = UserResponse.builder()
                .id(1L)
                .email("admin@example.com")
                .fullName("Quản trị viên")
                .role(UserRole.SYSTEM_ADMINISTRATOR)
                .status(UserStatus.ACTIVE)
                .active(true)
                .facilityIds(List.of())
                .build();

        when(userService.getUserById(1L)).thenReturn(response);

        mockMvc.perform(get("/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.fullName").value("Quản trị viên"));
    }

    @Test
    @DisplayName("POST /users tạo tài khoản mới trả về 201 Created")
    void testCreateUser() throws Exception {
        CreateUserRequest request = new CreateUserRequest(
                "Nhân viên A",
                "staff@example.com",
                "0901234567",
                "123456789",
                UserRole.FACILITY_STAFF,
                List.of(1L),
                "Secret123"
        );

        UserResponse response = UserResponse.builder()
                .id(2L)
                .email("staff@example.com")
                .fullName("Nhân viên A")
                .role(UserRole.FACILITY_STAFF)
                .status(UserStatus.ACTIVE)
                .active(true)
                .facilityIds(List.of(1L))
                .build();

        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(response);

        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.email").value("staff@example.com"));
    }

    @Test
    @DisplayName("PUT /users/{id} cập nhật thông tin trả về 200 OK")
    void testUpdateUser() throws Exception {
        UpdateUserRequest request = new UpdateUserRequest("Tên Đã Đổi", "0999999999", "999999999");
        UserResponse response = UserResponse.builder()
                .id(1L)
                .fullName("Tên Đã Đổi")
                .email("admin@example.com")
                .role(UserRole.SYSTEM_ADMINISTRATOR)
                .status(UserStatus.ACTIVE)
                .active(true)
                .build();

        when(userService.updateUser(eq(1L), any(UpdateUserRequest.class))).thenReturn(response);

        mockMvc.perform(put("/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Tên Đã Đổi"));
    }

    @Test
    @DisplayName("PATCH /users/{id}/role gán vai trò trả về 200 OK (SA-02)")
    void testUpdateUserRole() throws Exception {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.FACILITY_MANAGER, List.of(1L, 2L));
        UserResponse response = UserResponse.builder()
                .id(1L)
                .role(UserRole.FACILITY_MANAGER)
                .facilityIds(List.of(1L, 2L))
                .build();

        when(userService.updateUserRole(eq(1L), any(UpdateUserRoleRequest.class))).thenReturn(response);

        mockMvc.perform(patch("/users/1/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("FACILITY_MANAGER"))
                .andExpect(jsonPath("$.facilityIds[0]").value(1));
    }

    @Test
    @DisplayName("PATCH /users/{id}/status cập nhật trạng thái trả về 200 OK (SA-01)")
    void testUpdateUserStatus() throws Exception {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(false);
        UserResponse response = UserResponse.builder()
                .id(1L)
                .status(UserStatus.INACTIVE)
                .active(false)
                .build();

        when(userService.updateUserStatus(eq(1L), any(UpdateUserStatusRequest.class))).thenReturn(response);

        mockMvc.perform(patch("/users/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    @DisplayName("GET /users/{id}/facilities trả về danh sách cơ sở được phân công 200 OK (SA-03)")
    void testGetUserFacilities() throws Exception {
        UserResponse response = UserResponse.builder()
                .id(1L)
                .facilityIds(List.of(1L, 2L))
                .build();

        when(userService.getUserById(1L)).thenReturn(response);

        mockMvc.perform(get("/users/1/facilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value(1))
                .andExpect(jsonPath("$[1]").value(2));
    }

    @Test
    @DisplayName("GET /users/{id}/activity-logs trả về danh sách hoạt động 200 OK")
    void testGetUserActivityLogs() throws Exception {
        com.swp391.selfstorage.user.dto.AuditLogResponse item = com.swp391.selfstorage.user.dto.AuditLogResponse.builder()
                .id(10L)
                .userId(1L)
                .action("UPDATE_PROFILE")
                .build();
        PageResponse<com.swp391.selfstorage.user.dto.AuditLogResponse> page = new PageResponse<>(List.of(item), 0, 20, 1, 1);
        when(auditLogService.getUserActivityLogs(eq(1L), any(), any(Pageable.class), any())).thenReturn(page);

        mockMvc.perform(get("/users/1/activity-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(10))
                .andExpect(jsonPath("$.content[0].action").value("UPDATE_PROFILE"));
    }
}
