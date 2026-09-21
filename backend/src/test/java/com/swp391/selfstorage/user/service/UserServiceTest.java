package com.swp391.selfstorage.user.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.user.dto.CreateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRequest;
import com.swp391.selfstorage.user.dto.UpdateUserRoleRequest;
import com.swp391.selfstorage.user.dto.UpdateUserStatusRequest;
import com.swp391.selfstorage.user.dto.UserResponse;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserFacilityAssignment;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.mapper.UserMapper;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserFacilityAssignmentRepository assignmentRepository;

    @Mock
    private FacilityRepository facilityRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Spy
    private UserMapper userMapper = new UserMapper();

    @InjectMocks
    private UserServiceImpl userService;

    private AppUser sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new AppUser(
                "tung@example.com",
                "hashed_pwd",
                "Lê Thanh Tùng",
                "0901234567",
                "0123456789",
                UserRole.STORAGE_CUSTOMER,
                UserStatus.ACTIVE
        );
        sampleUser.setId(10L);
    }

    @Test
    @DisplayName("Lấy danh sách người dùng phân trang thành công")
    void getUsers_Success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<AppUser> page = new PageImpl<>(List.of(sampleUser), pageable, 1);

        when(userRepository.findByFilters(eq("Tùng"), eq(UserRole.STORAGE_CUSTOMER), eq(UserStatus.ACTIVE), eq(pageable)))
                .thenReturn(page);
        when(assignmentRepository.findFacilityIdsByUserId(10L)).thenReturn(List.of());

        PageResponse<UserResponse> result = userService.getUsers("Tùng", UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getEmail()).isEqualTo("tung@example.com");
        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("Lấy thông tin người dùng theo ID thành công")
    void getUserById_Success() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(assignmentRepository.findFacilityIdsByUserId(10L)).thenReturn(List.of(1L, 2L));

        UserResponse result = userService.getUserById(10L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getFacilityIds()).containsExactly(1L, 2L);
    }

    @Test
    @DisplayName("Lấy người dùng thất bại khi ID không tồn tại (404 USER_NOT_FOUND)")
    void getUserById_NotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(999L))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("Tạo người dùng mới thành công")
    void createUser_Success() {
        CreateUserRequest request = new CreateUserRequest(
                "Trần Văn B",
                "b@example.com",
                "0912345678",
                "123456789",
                UserRole.FACILITY_STAFF,
                List.of(1L),
                "Secret123"
        );

        AppUser savedUser = new AppUser(
                "b@example.com",
                "encoded_secret",
                "Trần Văn B",
                "0912345678",
                "123456789",
                UserRole.FACILITY_STAFF,
                UserStatus.ACTIVE
        );
        savedUser.setId(20L);

        when(userRepository.existsByEmail("b@example.com")).thenReturn(false);
        when(facilityRepository.existsById(1L)).thenReturn(true);
        when(passwordEncoder.encode("Secret123")).thenReturn("encoded_secret");
        when(userRepository.save(any(AppUser.class))).thenReturn(savedUser);
        when(assignmentRepository.findFacilityIdsByUserId(20L)).thenReturn(List.of(1L));

        UserResponse response = userService.createUser(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(20L);
        assertThat(response.getRole()).isEqualTo(UserRole.FACILITY_STAFF);
        verify(assignmentRepository).save(any(UserFacilityAssignment.class));
    }

    @Test
    @DisplayName("Tạo người dùng thất bại khi email đã tồn tại (409 EMAIL_ALREADY_EXISTS)")
    void createUser_EmailAlreadyExists() {
        CreateUserRequest request = new CreateUserRequest(
                "Trần Văn B",
                "tung@example.com",
                "0912345678",
                "123456789",
                UserRole.STORAGE_CUSTOMER,
                List.of(),
                "Secret123"
        );

        when(userRepository.existsByEmail("tung@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("Tạo Staff thất bại khi thiếu cơ sở (400 ROLE_REQUIRES_FACILITY)")
    void createUser_StaffWithoutFacility_ThrowsException() {
        CreateUserRequest request = new CreateUserRequest(
                "Trần Văn B",
                "staff@example.com",
                "0912345678",
                "123456789",
                UserRole.FACILITY_STAFF,
                List.of(), // Không có cơ sở
                "Secret123"
        );

        when(userRepository.existsByEmail("staff@example.com")).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ROLE_REQUIRES_FACILITY);
    }

    @Test
    @DisplayName("Tạo Staff thất bại khi cơ sở không tồn tại (404 FACILITY_NOT_FOUND)")
    void createUser_FacilityNotFound() {
        CreateUserRequest request = new CreateUserRequest(
                "Trần Văn B",
                "staff@example.com",
                "0912345678",
                "123456789",
                UserRole.FACILITY_STAFF,
                List.of(999L),
                "Secret123"
        );

        when(userRepository.existsByEmail("staff@example.com")).thenReturn(false);
        when(facilityRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FACILITY_NOT_FOUND);
    }

    @Test
    @DisplayName("Cập nhật thông tin người dùng thành công")
    void updateUser_Success() {
        UpdateUserRequest request = new UpdateUserRequest("Lê Thanh Tùng (Đã đổi tên)", "0988888888", "987654321");

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(AppUser.class))).thenReturn(sampleUser);
        when(assignmentRepository.findFacilityIdsByUserId(10L)).thenReturn(List.of());

        UserResponse response = userService.updateUser(10L, request);

        assertThat(response).isNotNull();
        assertThat(sampleUser.getFullName()).isEqualTo("Lê Thanh Tùng (Đã đổi tên)");
        assertThat(sampleUser.getPhone()).isEqualTo("0988888888");
        assertThat(sampleUser.getIdentityNumber()).isEqualTo("987654321");
    }

    @Test
    @DisplayName("Gán vai trò và cập nhật danh sách cơ sở thành công (SA-02, SA-03)")
    void updateUserRole_Success() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.FACILITY_MANAGER, List.of(1L, 2L));

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(facilityRepository.existsById(1L)).thenReturn(true);
        when(facilityRepository.existsById(2L)).thenReturn(true);
        when(userRepository.save(any(AppUser.class))).thenReturn(sampleUser);
        when(assignmentRepository.findFacilityIdsByUserId(10L)).thenReturn(List.of(1L, 2L));

        UserResponse response = userService.updateUserRole(10L, request);

        assertThat(response).isNotNull();
        assertThat(sampleUser.getRole()).isEqualTo(UserRole.FACILITY_MANAGER);
        verify(assignmentRepository).deleteByUserId(10L);
    }

    @Test
    @DisplayName("Gán vai trò Staff thất bại khi thiếu cơ sở (400 ROLE_REQUIRES_FACILITY)")
    void updateUserRole_MissingFacility_ThrowsException() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.FACILITY_STAFF, List.of());

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));

        assertThatThrownBy(() -> userService.updateUserRole(10L, request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ROLE_REQUIRES_FACILITY);
    }

    @Test
    @DisplayName("Gán vai trò về Customer thành công và xóa phân công cơ sở cũ")
    void updateUserRole_ToCustomer_ClearsAssignments() {
        sampleUser.setRole(UserRole.FACILITY_STAFF);
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.STORAGE_CUSTOMER, List.of());

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(AppUser.class))).thenReturn(sampleUser);
        when(assignmentRepository.findFacilityIdsByUserId(10L)).thenReturn(List.of());

        UserResponse response = userService.updateUserRole(10L, request);

        assertThat(response).isNotNull();
        assertThat(sampleUser.getRole()).isEqualTo(UserRole.STORAGE_CUSTOMER);
        verify(assignmentRepository).deleteByUserId(10L);
    }

    @Test
    @DisplayName("Gán vai trò BOM thành công không cần cơ sở")
    void updateUserRole_ToBusinessOperationsManager_Success() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.BUSINESS_OPERATIONS_MANAGER, List.of());

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(AppUser.class))).thenReturn(sampleUser);
        when(assignmentRepository.findFacilityIdsByUserId(10L)).thenReturn(List.of());

        UserResponse response = userService.updateUserRole(10L, request);

        assertThat(response).isNotNull();
        assertThat(sampleUser.getRole()).isEqualTo(UserRole.BUSINESS_OPERATIONS_MANAGER);
    }

    @Test
    @DisplayName("Cập nhật trạng thái người dùng thành công (SA-01)")
    void updateUserStatus_Success() {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(false);

        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(AppUser.class))).thenReturn(sampleUser);
        when(assignmentRepository.findFacilityIdsByUserId(10L)).thenReturn(List.of());

        UserResponse response = userService.updateUserStatus(10L, request);

        assertThat(response).isNotNull();
        assertThat(sampleUser.getStatus()).isEqualTo(UserStatus.INACTIVE);
    }
}
