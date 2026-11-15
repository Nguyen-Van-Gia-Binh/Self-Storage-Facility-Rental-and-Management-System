package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.AssignReturnStaffRequest;
import com.swp391.selfstorage.contract.dto.ContractFilterRequest;
import com.swp391.selfstorage.contract.dto.ContractResponse;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.service.impl.ContractServiceImpl;
import com.swp391.selfstorage.support.entity.AssignmentTaskType;
import com.swp391.selfstorage.support.entity.StaffDailyAssignment;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.user.entity.AppUser;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ContractAssignCheckInStaffTest {

    @Mock
    private RentalContractRepository contractRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserFacilityAssignmentRepository userFacilityAssignmentRepository;
    @Mock
    private StaffDailyAssignmentRepository staffDailyAssignmentRepository;
    @Mock
    private com.swp391.selfstorage.contract.repository.ReturnRequestRepository returnRequestRepository;

    @InjectMocks
    private ContractServiceImpl contractService;

    private RentalContract pendingContract;
    private AppUser activeStaff;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(contractService, "userRepository", userRepository);
        ReflectionTestUtils.setField(contractService, "userFacilityAssignmentRepository", userFacilityAssignmentRepository);
        ReflectionTestUtils.setField(contractService, "staffDailyAssignmentRepository", staffDailyAssignmentRepository);
        ReflectionTestUtils.setField(contractService, "returnRequestRepository", returnRequestRepository);

        pendingContract = RentalContract.builder()
                .id(100L)
                .code("CTR-20261107-100")
                .facilityId(1L)
                .storageUnitId(20L)
                .customerId(10L)
                .status(ContractStatus.PENDING_CHECK_IN)
                .startDate(LocalDate.now())
                .build();

        activeStaff = new AppUser();
        activeStaff.setId(5L);
        activeStaff.setFullName("Trần Nhân Viên");
        activeStaff.setRole(UserRole.FACILITY_STAFF);
        activeStaff.setStatus(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("Gán nhân viên tiếp đón thành công khi nhân viên thuộc cùng cơ sở và đang ACTIVE")
    void testAssignCheckInStaff_Success() {
        AssignReturnStaffRequest req = new AssignReturnStaffRequest();
        req.setStaffId(5L);
        req.setNotes("Tiếp đón chu đáo");

        when(contractRepository.findByIdAndFacilityIdIn(100L, List.of(1L)))
                .thenReturn(Optional.of(pendingContract));
        when(userRepository.findById(5L)).thenReturn(Optional.of(activeStaff));
        when(userFacilityAssignmentRepository.existsByUserIdAndFacilityId(5L, 1L)).thenReturn(true);
        when(staffDailyAssignmentRepository.findByReferenceTypeAndReferenceId("CONTRACT", 100L))
                .thenReturn(Optional.empty());

        ContractResponse response = contractService.assignCheckInStaff(100L, req, 2L, List.of(1L));

        assertNotNull(response);
        verify(staffDailyAssignmentRepository).save(any(StaffDailyAssignment.class));
    }

    @Test
    @DisplayName("Quăng STAFF_NOT_IN_FACILITY khi nhân viên không thuộc cơ sở của hợp đồng")
    void testAssignCheckInStaff_StaffNotInFacility() {
        AssignReturnStaffRequest req = new AssignReturnStaffRequest();
        req.setStaffId(5L);

        when(contractRepository.findByIdAndFacilityIdIn(100L, List.of(1L)))
                .thenReturn(Optional.of(pendingContract));
        when(userRepository.findById(5L)).thenReturn(Optional.of(activeStaff));
        when(userFacilityAssignmentRepository.existsByUserIdAndFacilityId(5L, 1L)).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class, () ->
                contractService.assignCheckInStaff(100L, req, 2L, List.of(1L)));

        assertEquals(ErrorCode.STAFF_NOT_IN_FACILITY, ex.getErrorCode());
        verify(staffDailyAssignmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Quăng STAFF_NOT_ACTIVE khi tài khoản nhân viên đang INACTIVE")
    void testAssignCheckInStaff_StaffInactive() {
        AppUser inactiveStaff = new AppUser();
        inactiveStaff.setId(6L);
        inactiveStaff.setFullName("Lê Nghỉ Việc");
        inactiveStaff.setRole(UserRole.FACILITY_STAFF);
        inactiveStaff.setStatus(UserStatus.INACTIVE);

        AssignReturnStaffRequest req = new AssignReturnStaffRequest();
        req.setStaffId(6L);

        when(contractRepository.findByIdAndFacilityIdIn(100L, List.of(1L)))
                .thenReturn(Optional.of(pendingContract));
        when(userRepository.findById(6L)).thenReturn(Optional.of(inactiveStaff));

        CustomException ex = assertThrows(CustomException.class, () ->
                contractService.assignCheckInStaff(100L, req, 2L, List.of(1L)));

        assertEquals(ErrorCode.STAFF_NOT_ACTIVE, ex.getErrorCode());
        verify(staffDailyAssignmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Quăng CONTRACT_NOT_PENDING_CHECKIN khi hợp đồng không ở trạng thái PENDING_CHECK_IN")
    void testAssignCheckInStaff_ContractNotPendingCheckIn() {
        pendingContract.setStatus(ContractStatus.ACTIVE);

        AssignReturnStaffRequest req = new AssignReturnStaffRequest();
        req.setStaffId(5L);

        when(contractRepository.findByIdAndFacilityIdIn(100L, List.of(1L)))
                .thenReturn(Optional.of(pendingContract));

        CustomException ex = assertThrows(CustomException.class, () ->
                contractService.assignCheckInStaff(100L, req, 2L, List.of(1L)));

        assertEquals(ErrorCode.CONTRACT_NOT_PENDING_CHECKIN, ex.getErrorCode());
    }

    @Test
    @DisplayName("FM-05: assignReturnStaff gán đúng AssignmentTaskType.RETURN và không ghi đè HANDOVER")
    void testAssignReturnInspectionStaff_success() {
        RentalContract returnContract = RentalContract.builder()
                .id(200L)
                .code("CTR-20261114-5766")
                .facilityId(1L)
                .storageUnitId(20L)
                .customerId(10L)
                .status(ContractStatus.PENDING_RETURN)
                .build();

        AssignReturnStaffRequest req = new AssignReturnStaffRequest();
        req.setStaffId(5L);
        req.setNotes("Kiểm tra nghiệm thu trả kho");

        when(contractRepository.findByIdAndFacilityIdIn(200L, List.of(1L)))
                .thenReturn(Optional.of(returnContract));
        when(userRepository.findById(5L)).thenReturn(Optional.of(activeStaff));
        when(userFacilityAssignmentRepository.existsByUserIdAndFacilityId(5L, 1L)).thenReturn(true);
        when(returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(200L))
                .thenReturn(Optional.empty());

        ContractResponse response = contractService.assignReturnStaff(200L, req, 2L, List.of(1L));

        assertNotNull(response);
        verify(staffDailyAssignmentRepository).save(argThat(a ->
                a.getTaskType() == AssignmentTaskType.RETURN && a.getStaffId().equals(5L)
        ));
    }

    @Test
    @DisplayName("getContractsPage: Hợp đồng PENDING_RETURN chưa gán nghiệm thu không được tự động gán nhân viên từ check-in HANDOVER")
    void testGetContractsPage_PendingReturn_DoesNotAutoAssignHandoverStaff() {
        RentalContract returnContract = RentalContract.builder()
                .id(200L)
                .code("CTR-20261114-5766")
                .facilityId(1L)
                .storageUnitId(20L)
                .customerId(10L)
                .status(ContractStatus.PENDING_RETURN)
                .build();

        com.swp391.selfstorage.contract.entity.ReturnRequest req = com.swp391.selfstorage.contract.entity.ReturnRequest.builder()
                .id(1L)
                .contractId(200L)
                .inspectedBy(null) // Chưa phân công nhân sự nghiệm thu!
                .build();

        StaffDailyAssignment handoverAssign = StaffDailyAssignment.builder()
                .id(1L)
                .staffId(8L) // Trần Văn Hùng tiếp đón từ lúc check-in
                .referenceType("CONTRACT")
                .referenceId(200L)
                .taskType(AssignmentTaskType.HANDOVER)
                .build();

        when(contractRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(returnContract)));
        when(returnRequestRepository.findByContractIdInOrderByCreatedAtDesc(anyCollection()))
                .thenReturn(List.of(req));
        when(staffDailyAssignmentRepository.findByReferenceTypeAndReferenceIdIn(eq("CONTRACT"), anyCollection()))
                .thenReturn(List.of(handoverAssign));

        ContractFilterRequest filter = ContractFilterRequest.builder()
                .facilityId(1L)
                .status(ContractStatus.PENDING_RETURN)
                .build();

        com.swp391.selfstorage.common.dto.PageResponse<ContractSummaryResponse> page =
                contractService.getContractsPage(filter, org.springframework.data.domain.PageRequest.of(0, 10), List.of(1L));

        assertNotNull(page);
        assertEquals(1, page.getContent().size());
        // KHÔNG ĐƯỢC lấy staffId 8 từ handover! Phải trả về null để giao diện hiện Chưa gán nhân sự
        assertNull(page.getContent().get(0).getAssignedStaffId());
        assertNull(page.getContent().get(0).getAssignedStaffName());
    }
}
