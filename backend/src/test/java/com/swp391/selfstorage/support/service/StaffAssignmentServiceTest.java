package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.entity.ReturnRequest;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.repository.ReturnRequestRepository;
import com.swp391.selfstorage.support.dto.TaskAssignmentRequest;
import com.swp391.selfstorage.support.dto.TaskAssignmentResponse;
import com.swp391.selfstorage.support.entity.AssignmentTaskType;
import com.swp391.selfstorage.support.entity.StaffDailyAssignment;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.support.service.impl.StaffAssignmentServiceImpl;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserFacilityAssignment;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StaffAssignmentServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RentalContractRepository rentalContractRepository;

    @Mock
    private StaffDailyAssignmentRepository staffDailyAssignmentRepository;

    @Mock
    private StaffSupportService staffSupportService;

    @Mock
    private ReturnRequestRepository returnRequestRepository;

    @Mock
    private UserFacilityAssignmentRepository userFacilityAssignmentRepository;

    @InjectMocks
    private StaffAssignmentServiceImpl staffAssignmentService;

    private AppUser sampleStaff;
    private UserPrincipal managerUser;

    @BeforeEach
    void setUp() {
        sampleStaff = new AppUser();
        sampleStaff.setId(10L);
        sampleStaff.setFullName("Trần Văn Hùng");
        sampleStaff.setRole(UserRole.FACILITY_STAFF);
        sampleStaff.setStatus(UserStatus.ACTIVE);

        managerUser = new UserPrincipal(
                2L, "manager@storage.vn", "pass", "Lê Quản Lý Cơ Sở",
                UserRole.FACILITY_MANAGER, UserStatus.ACTIVE, java.util.List.of(1L), java.util.Collections.emptyList()
        );
    }

    @Test
    @DisplayName("Khóa đổi người: Ném ngoại lệ khi đổi nhân sự cho nhiệm vụ CHECK-IN đã hoàn thành (HĐ ACTIVE)")
    void shouldThrowException_whenAssigningCheckInOnCompletedContract() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleStaff));

        RentalContract activeContract = new RentalContract();
        activeContract.setId(500L);
        activeContract.setStatus(ContractStatus.ACTIVE); // Đã check-in hoàn tất
        activeContract.setFacilityId(1L);
        when(rentalContractRepository.findById(500L)).thenReturn(Optional.of(activeContract));

        TaskAssignmentRequest request = TaskAssignmentRequest.builder()
                .taskType("CHECK_IN")
                .contractId(500L)
                .staffId(10L)
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> staffAssignmentService.assignStaff(request, managerUser));

        assertEquals(ErrorCode.CONTRACT_NOT_PENDING_CHECKIN, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("đã khóa chức năng đổi người"));
    }

    @Test
    @DisplayName("Khóa đổi người: Ném ngoại lệ khi đổi nhân sự cho nhiệm vụ RETURN đã hoàn tất (HĐ RETURNED)")
    void shouldThrowException_whenAssigningReturnOnCompletedContract() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleStaff));

        RentalContract returnedContract = new RentalContract();
        returnedContract.setId(600L);
        returnedContract.setStatus(ContractStatus.RETURNED); // Đã trả kho hoàn tất
        returnedContract.setFacilityId(1L);
        when(rentalContractRepository.findById(600L)).thenReturn(Optional.of(returnedContract));

        TaskAssignmentRequest request = TaskAssignmentRequest.builder()
                .taskType("RETURN")
                .contractId(600L)
                .staffId(10L)
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> staffAssignmentService.assignStaff(request, managerUser));

        assertEquals(ErrorCode.CONTRACT_NOT_PENDING_RETURN, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("đã khóa chức năng đổi người"));
    }

    @Test
    @DisplayName("Khóa đổi người: Ném ngoại lệ khi nhiệm vụ RETURN đã được kiểm tra (inspectedAt != null)")
    void shouldThrowException_whenAssigningReturnOnAlreadyInspectedRequest() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleStaff));

        RentalContract contract = new RentalContract();
        contract.setId(700L);
        contract.setStatus(ContractStatus.PENDING_RETURN);
        contract.setFacilityId(1L);
        when(rentalContractRepository.findById(700L)).thenReturn(Optional.of(contract));

        ReturnRequest returnReq = new ReturnRequest();
        returnReq.setContractId(700L);
        returnReq.setInspectedAt(OffsetDateTime.now()); // Đã kiểm tra xong
        when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(700L))
                .thenReturn(Optional.of(returnReq));

        TaskAssignmentRequest request = TaskAssignmentRequest.builder()
                .taskType("RETURN")
                .contractId(700L)
                .staffId(10L)
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> staffAssignmentService.assignStaff(request, managerUser));

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("đã khóa chức năng đổi người"));
    }

    @Test
    @DisplayName("Thành công: Phân công nhân viên khi nhiệm vụ CHECK-IN đang ở PENDING_CHECK_IN")
    void shouldAssignCheckInStaffSuccessfully_whenContractIsPendingCheckIn() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(sampleStaff));

        RentalContract pendingContract = new RentalContract();
        pendingContract.setId(501L);
        pendingContract.setStatus(ContractStatus.PENDING_CHECK_IN);
        pendingContract.setFacilityId(1L);
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(pendingContract));

        when(userFacilityAssignmentRepository.existsByUserIdAndFacilityId(10L, 1L)).thenReturn(true);
        when(staffDailyAssignmentRepository.findByReferenceTypeAndReferenceIdAndTaskType(
                eq("CONTRACT"), eq(501L), eq(AssignmentTaskType.HANDOVER)))
                .thenReturn(Optional.empty());

        TaskAssignmentRequest request = TaskAssignmentRequest.builder()
                .taskType("CHECK_IN")
                .contractId(501L)
                .staffId(10L)
                .notes("Hỗ trợ khách kiểm tra chìa khóa")
                .build();

        TaskAssignmentResponse response = staffAssignmentService.assignStaff(request, managerUser);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals(10L, response.getAssignedStaffId());
        assertEquals("Trần Văn Hùng", response.getAssignedStaffName());
        verify(staffDailyAssignmentRepository, times(1)).save(any(StaffDailyAssignment.class));
    }
}
