package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.support.dto.StaffDailyTasksResponse;
import com.swp391.selfstorage.support.entity.*;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
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
import org.springframework.test.util.ReflectionTestUtils;

import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StaffDailyTaskServiceTest {

    @Mock
    private SupportRequestRepository supportRequestRepository;

    @Mock
    private StaffDailyAssignmentRepository staffDailyAssignmentRepository;

    @Mock
    private RentalContractRepository rentalContractRepository;

    @Mock
    private StorageUnitRepository storageUnitRepository;

    @Mock
    private FacilityRepository facilityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserFacilityAssignmentRepository userFacilityAssignmentRepository;

    @Mock
    private PolicyVersionRepository policyVersionRepository;

    @InjectMocks
    private StaffDailyTaskServiceImpl staffDailyTaskService;

    private AppUser sampleStaff;
    private AppUser sampleCustomer;
    private Facility sampleFacility;
    private StorageUnit sampleUnit;
    private UserPrincipal staffPrincipal;
    private UserPrincipal managerPrincipal;

    @BeforeEach
    void setUp() {
        sampleStaff = new AppUser("staff@test.com", "hash", "Trần Văn Staff", "0901234567", "123456789",
                UserRole.FACILITY_STAFF, UserStatus.ACTIVE);
        ReflectionTestUtils.setField(sampleStaff, "id", 8L);

        sampleCustomer = new AppUser("customer@test.com", "hash", "Nguyễn Văn Customer", "0987654321", "987654321",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE);
        ReflectionTestUtils.setField(sampleCustomer, "id", 15L);

        sampleFacility = new Facility();
        sampleFacility.setName("Kho Thủ Đức Central");
        ReflectionTestUtils.setField(sampleFacility, "id", 1L);

        sampleUnit = new StorageUnit();
        sampleUnit.setId(101L);
        sampleUnit.setCode("S-101");
        sampleUnit.setFacilityId(1L);

        staffPrincipal = new UserPrincipal(8L, "staff@test.com", "hash", "Trần Văn Staff",
                UserRole.FACILITY_STAFF, UserStatus.ACTIVE, List.of(1L), Collections.emptyList());

        managerPrincipal = new UserPrincipal(2L, "manager@test.com", "hash", "Lê Văn Manager",
                UserRole.FACILITY_MANAGER, UserStatus.ACTIVE, List.of(1L), Collections.emptyList());
    }

    private RentalContract createContract(Long id, String code, Long resId, Long custId, Long facId, Long unitId,
                                          LocalDate startDate, LocalDate endDate, ContractStatus status,
                                          LocalDate checkinDate, LocalDate returnDate) {
        RentalContract c = new RentalContract();
        c.setId(id);
        c.setCode(code);
        c.setReservationId(resId);
        c.setCustomerId(custId);
        c.setFacilityId(facId);
        c.setStorageUnitId(unitId);
        c.setStartDate(startDate);
        c.setEndDateExclusive(endDate);
        c.setStatus(status);
        c.setCheckinDate(checkinDate);
        c.setReturnDate(returnDate);
        return c;
    }

    @Test
    @DisplayName("Staff xem bảng công việc của chính mình thành công (đủ 3 nhóm Check-in, Return, Support)")
    void shouldGetDailyTasks_successfully_forCurrentStaff() {
        LocalDate today = LocalDate.of(2026, 10, 1);

        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaff));
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(8L)).thenReturn(List.of(1L));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));

        // Check-in contract starting today
        RentalContract checkInContract = createContract(501L, "CTR-20261001-001", 1042L, 15L, 1L, 101L,
                today, today.plusMonths(1), ContractStatus.PENDING_CHECK_IN, null, null);

        // Return contract ending today
        RentalContract returnContract = createContract(502L, "CTR-20260901-002", 1020L, 15L, 1L, 101L,
                today.minusMonths(1), today, ContractStatus.PENDING_RETURN, null, null);

        StaffDailyAssignment checkInAssignment = StaffDailyAssignment.builder()
                .id(1L)
                .staffId(8L)
                .facilityId(1L)
                .workDate(today)
                .taskType(AssignmentTaskType.HANDOVER)
                .referenceType("CONTRACT")
                .referenceId(501L)
                .build();

        StaffDailyAssignment returnAssignment = StaffDailyAssignment.builder()
                .id(2L)
                .staffId(8L)
                .facilityId(1L)
                .workDate(today)
                .taskType(AssignmentTaskType.RETURN)
                .referenceType("CONTRACT")
                .referenceId(502L)
                .build();

        when(staffDailyAssignmentRepository.findByStaffIdAndWorkDate(8L, today))
                .thenReturn(List.of(checkInAssignment, returnAssignment));
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(checkInContract));
        when(rentalContractRepository.findById(502L)).thenReturn(Optional.of(returnContract));

        // Support ticket
        SupportRequest ticket = SupportRequest.builder()
                .id(301L)
                .code("SR-20261001-001")
                .customerId(15L)
                .contractId(501L)
                .storageUnitId(101L)
                .category(SupportCategory.LOCK_ACCESS)
                .description("Hỏng khóa ô kho S-101")
                .isUrgent(true)
                .status(SupportStatus.ASSIGNED)
                .assignedStaffId(8L)
                .slaDueAt(OffsetDateTime.now().plusHours(4))
                .build();

        when(supportRequestRepository.findAllByAssignedStaffId(8L)).thenReturn(List.of(ticket));
        when(userRepository.findById(15L)).thenReturn(Optional.of(sampleCustomer));
        when(storageUnitRepository.findById(101L)).thenReturn(Optional.of(sampleUnit));

        // Execute
        StaffDailyTasksResponse response = staffDailyTaskService.getDailyTasks(8L, today, false, staffPrincipal);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getDate()).isEqualTo(today);
        assertThat(response.getStaffId()).isEqualTo(8L);
        assertThat(response.getStaffName()).isEqualTo("Trần Văn Staff");
        assertThat(response.getFacilityId()).isEqualTo(1L);
        assertThat(response.getFacilityName()).isEqualTo("Kho Thủ Đức Central");

        // Group 1: Check-in
        assertThat(response.getCheckInTasks()).hasSize(1);
        assertThat(response.getCheckInTasks().get(0).getContractCode()).isEqualTo("CTR-20261001-001");
        assertThat(response.getCheckInTasks().get(0).getCustomerName()).isEqualTo("Nguyễn Văn Customer");
        assertThat(response.getCheckInTasks().get(0).getStorageUnitCode()).isEqualTo("S-101");
        assertThat(response.getCheckInTasks().get(0).isCompleted()).isFalse();

        // Group 2: Return
        assertThat(response.getReturnTasks()).hasSize(1);
        assertThat(response.getReturnTasks().get(0).getContractCode()).isEqualTo("CTR-20260901-002");
        assertThat(response.getReturnTasks().get(0).isCompleted()).isFalse();

        // Group 3: Support
        assertThat(response.getSupportTasks()).hasSize(1);
        assertThat(response.getSupportTasks().get(0).getCode()).isEqualTo("SR-20261001-001");
        assertThat(response.getSupportTasks().get(0).getIsUrgent()).isTrue();
        assertThat(response.getSupportTasks().get(0).isCompleted()).isFalse();

        // Summary
        assertThat(response.getSummary().getTotalTasks()).isEqualTo(3);
        assertThat(response.getSummary().getPendingTasks()).isEqualTo(3);
        assertThat(response.getSummary().getCompletedTasks()).isEqualTo(0);
        assertThat(response.getSummary().getUrgentTasks()).isEqualTo(1);
        assertThat(response.getSummary().getCheckInCount()).isEqualTo(1);
        assertThat(response.getSummary().getReturnCount()).isEqualTo(1);
        assertThat(response.getSummary().getSupportCount()).isEqualTo(1);

        // Aliases API-SPEC § 12
        assertThat(response.getPendingCheckIns()).hasSize(1);
        assertThat(response.getPendingReturns()).hasSize(1);
        assertThat(response.getOpenSupportRequests()).hasSize(1);
    }

    @Test
    @DisplayName("Facility Manager xem bảng công việc của Staff thuộc cơ sở mình quản lý thành công")
    void shouldGetDailyTasks_successfully_forFacilityManager() {
        LocalDate today = LocalDate.of(2026, 10, 1);

        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaff));
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(8L)).thenReturn(List.of(1L));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));
        when(staffDailyAssignmentRepository.findByStaffIdAndWorkDate(8L, today)).thenReturn(Collections.emptyList());
        when(supportRequestRepository.findAllByAssignedStaffId(8L)).thenReturn(Collections.emptyList());

        StaffDailyTasksResponse response = staffDailyTaskService.getDailyTasks(8L, today, false, managerPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.getStaffId()).isEqualTo(8L);
        assertThat(response.getSummary().getTotalTasks()).isEqualTo(0);
    }

    @Test
    @DisplayName("Chặn Staff cố tình xem bảng công việc của Staff khác (ACCESS_DENIED)")
    void shouldThrowAccessDenied_whenStaffViewsAnotherStaffTasks() {
        LocalDate today = LocalDate.of(2026, 10, 1);

        when(userRepository.findById(9L)).thenReturn(Optional.of(sampleStaff));

        assertThatThrownBy(() -> staffDailyTaskService.getDailyTasks(9L, today, false, staffPrincipal))
                .isInstanceOf(CustomException.class)
                .matches(e -> ((CustomException) e).getErrorCode() == ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("Chặn Manager xem bảng công việc của Staff thuộc cơ sở khác (ACCESS_DENIED)")
    void shouldThrowAccessDenied_whenManagerViewsStaffInDifferentFacility() {
        LocalDate today = LocalDate.of(2026, 10, 1);

        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaff));
        // Staff belongs to facility 2, but manager only manages facility 1
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(8L)).thenReturn(List.of(2L));

        assertThatThrownBy(() -> staffDailyTaskService.getDailyTasks(8L, today, false, managerPrincipal))
                .isInstanceOf(CustomException.class)
                .matches(e -> ((CustomException) e).getErrorCode() == ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("Lọc trạng thái chưa xử lý (pendingOnly = true) chỉ trả về việc chưa hoàn thành")
    void shouldFilterPendingOnly_whenPendingOnlyIsTrue() {
        LocalDate today = LocalDate.of(2026, 10, 1);

        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaff));
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(8L)).thenReturn(List.of(1L));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));

        // 1 checkin pending, 1 checkin already completed (ACTIVE)
        RentalContract pendingContract = createContract(501L, "CTR-001", 1042L, 15L, 1L, 101L,
                today, today.plusMonths(1), ContractStatus.PENDING_CHECK_IN, null, null);

        RentalContract completedContract = createContract(502L, "CTR-002", 1043L, 15L, 1L, 101L,
                today, today.plusMonths(1), ContractStatus.ACTIVE, today, null);

        StaffDailyAssignment a1 = StaffDailyAssignment.builder()
                .id(1L).staffId(8L).facilityId(1L).workDate(today).taskType(AssignmentTaskType.HANDOVER)
                .referenceType("CONTRACT").referenceId(501L).build();
        StaffDailyAssignment a2 = StaffDailyAssignment.builder()
                .id(2L).staffId(8L).facilityId(1L).workDate(today).taskType(AssignmentTaskType.HANDOVER)
                .referenceType("CONTRACT").referenceId(502L).build();

        when(staffDailyAssignmentRepository.findByStaffIdAndWorkDate(8L, today)).thenReturn(List.of(a1, a2));
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(pendingContract));
        when(rentalContractRepository.findById(502L)).thenReturn(Optional.of(completedContract));
        when(supportRequestRepository.findAllByAssignedStaffId(8L)).thenReturn(Collections.emptyList());
        when(userRepository.findById(15L)).thenReturn(Optional.of(sampleCustomer));
        when(storageUnitRepository.findById(101L)).thenReturn(Optional.of(sampleUnit));

        StaffDailyTasksResponse response = staffDailyTaskService.getDailyTasks(8L, today, true, staffPrincipal);

        // Only the pending contract should remain
        assertThat(response.getCheckInTasks()).hasSize(1);
        assertThat(response.getCheckInTasks().get(0).getContractCode()).isEqualTo("CTR-001");
        assertThat(response.getSummary().getTotalTasks()).isEqualTo(1);
        assertThat(response.getSummary().getPendingTasks()).isEqualTo(1);
        assertThat(response.getSummary().getCompletedTasks()).isEqualTo(0);
    }

    @Test
    @DisplayName("Mặc định ngày hôm nay khi tham số date là null")
    void shouldDefaultToToday_whenDateIsNull() {
        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaff));
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(8L)).thenReturn(List.of(1L));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));
        when(staffDailyAssignmentRepository.findByStaffIdAndWorkDateBetween(any(), any(), any())).thenReturn(Collections.emptyList());
        when(supportRequestRepository.findAllByAssignedStaffId(8L)).thenReturn(Collections.emptyList());

        StaffDailyTasksResponse response = staffDailyTaskService.getDailyTasks(8L, null, false, staffPrincipal);

        assertThat(response.getDate()).isEqualTo(LocalDate.now(StaffDailyTaskServiceImpl.VN_ZONE));
    }

    @Test
    @DisplayName("Ném lỗi STAFF_NOT_FOUND khi staffId không tồn tại")
    void shouldThrowStaffNotFound_whenStaffDoesNotExist() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> staffDailyTaskService.getDailyTasks(999L, LocalDate.now(), false, staffPrincipal))
                .isInstanceOf(CustomException.class)
                .matches(e -> ((CustomException) e).getErrorCode() == ErrorCode.STAFF_NOT_FOUND);
    }

    @Test
    @DisplayName("Ném lỗi STAFF_NOT_ACTIVE khi nhân viên bị khóa tài khoản")
    void shouldThrowStaffNotActive_whenStaffIsInactive() {
        sampleStaff.setStatus(UserStatus.INACTIVE);
        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaff));

        assertThatThrownBy(() -> staffDailyTaskService.getDailyTasks(8L, LocalDate.now(), false, staffPrincipal))
                .isInstanceOf(CustomException.class)
                .matches(e -> ((CustomException) e).getErrorCode() == ErrorCode.STAFF_NOT_ACTIVE);
    }

    @Test
    @DisplayName("BR-CHK-05: Khi xem ca trực hôm nay, các đơn trễ hẹn trong 10 ngày ân hạn vẫn xuất hiện với cờ isLate=true và ẩn khi quá 10 ngày")
    void shouldIncludePendingCheckInDuringGraceDaysWindow_andExcludeAfterGraceExpires() {
        LocalDate today = LocalDate.now(StaffDailyTaskServiceImpl.VN_ZONE);
        LocalDate oneDayAgo = today.minusDays(1);
        LocalDate tenDaysAgo = today.minusDays(10);

        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaff));
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(8L)).thenReturn(List.of(1L));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));

        RentalContract contract1DayLate = createContract(601L, "CTR-1DAY-LATE", 2001L, 15L, 1L, 101L,
                oneDayAgo, oneDayAgo.plusMonths(3), ContractStatus.PENDING_CHECK_IN, null, null);
        contract1DayLate.setPolicySnapshot("{\"policyVersionId\":1,\"checkinGraceDays\":10,\"accessPinLength\":6}");

        RentalContract contract10DaysLate = createContract(602L, "CTR-10DAYS-LATE", 2002L, 15L, 1L, 101L,
                tenDaysAgo, tenDaysAgo.plusMonths(3), ContractStatus.PENDING_CHECK_IN, null, null);
        contract10DaysLate.setPolicySnapshot("{\"policyVersionId\":1,\"checkinGraceDays\":10,\"accessPinLength\":6}");

        StaffDailyAssignment a1 = StaffDailyAssignment.builder()
                .id(1L).staffId(8L).facilityId(1L).workDate(oneDayAgo).taskType(AssignmentTaskType.HANDOVER)
                .referenceType("CONTRACT").referenceId(601L).build();
        StaffDailyAssignment a2 = StaffDailyAssignment.builder()
                .id(2L).staffId(8L).facilityId(1L).workDate(tenDaysAgo).taskType(AssignmentTaskType.HANDOVER)
                .referenceType("CONTRACT").referenceId(602L).build();

        // 1. Khi xem hôm nay: cả 2 đơn trễ hạn trong vòng 10 ngày đều xuất hiện và được đánh dấu isLate
        when(staffDailyAssignmentRepository.findByStaffIdAndWorkDateBetween(org.mockito.ArgumentMatchers.eq(8L), any(), org.mockito.ArgumentMatchers.eq(today)))
                .thenReturn(List.of(a1, a2));
        when(rentalContractRepository.findById(601L)).thenReturn(Optional.of(contract1DayLate));
        when(rentalContractRepository.findById(602L)).thenReturn(Optional.of(contract10DaysLate));
        when(supportRequestRepository.findAllByAssignedStaffId(8L)).thenReturn(Collections.emptyList());
        when(userRepository.findById(15L)).thenReturn(Optional.of(sampleCustomer));
        when(storageUnitRepository.findById(101L)).thenReturn(Optional.of(sampleUnit));

        StaffDailyTasksResponse todayRes = staffDailyTaskService.getDailyTasks(8L, today, false, staffPrincipal);
        assertThat(todayRes.getCheckInTasks()).hasSize(2);
        assertThat(todayRes.getCheckInTasks().get(0).isLate()).isTrue();
        assertThat(todayRes.getCheckInTasks().get(0).getDaysLate()).isEqualTo(1);
        assertThat(todayRes.getCheckInTasks().get(1).isLate()).isTrue();
        assertThat(todayRes.getCheckInTasks().get(1).getDaysLate()).isEqualTo(10);

        // 2. Khi xem một ngày trong quá khứ (không phải hôm nay): Lọc chính xác ngày đó, không kéo việc trễ hạn sang
        LocalDate pastDate = today.minusDays(5);
        when(staffDailyAssignmentRepository.findByStaffIdAndWorkDate(8L, pastDate))
                .thenReturn(Collections.emptyList());
        StaffDailyTasksResponse pastRes = staffDailyTaskService.getDailyTasks(8L, pastDate, false, staffPrincipal);
        assertThat(pastRes.getCheckInTasks()).isEmpty();
    }

    @Test
    @DisplayName("BR-RES-06: Khách dời ngày nhận kho sang tương lai -> Task không xuất hiện ở ca trực hôm nay, chỉ xuất hiện ở ngày mới")
    void shouldExcludeCheckInTaskToday_whenCustomerRescheduledToFutureDate() {
        LocalDate today = LocalDate.now(StaffDailyTaskServiceImpl.VN_ZONE);
        LocalDate futureDate = today.plusDays(5);

        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaff));
        when(userFacilityAssignmentRepository.findFacilityIdsByUserId(8L)).thenReturn(List.of(1L));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(sampleFacility));

        RentalContract rescheduledContract = createContract(701L, "CTR-RESCHEDULED", 3001L, 15L, 1L, 101L,
                futureDate, futureDate.plusMonths(1), ContractStatus.PENDING_CHECK_IN, null, null);

        StaffDailyAssignment assignment = StaffDailyAssignment.builder()
                .id(99L).staffId(8L).facilityId(1L).workDate(futureDate).taskType(AssignmentTaskType.HANDOVER)
                .referenceType("CONTRACT").referenceId(701L).build();

        // 1. Khi xem ca trực hôm nay: task dời sang tương lai KHÔNG được xuất hiện
        when(staffDailyAssignmentRepository.findByStaffIdAndWorkDateBetween(org.mockito.ArgumentMatchers.eq(8L), any(), org.mockito.ArgumentMatchers.eq(today)))
                .thenReturn(Collections.emptyList());
        when(staffDailyAssignmentRepository.findByStaffId(8L))
                .thenReturn(List.of(assignment));
        when(rentalContractRepository.findById(701L)).thenReturn(Optional.of(rescheduledContract));
        when(supportRequestRepository.findAllByAssignedStaffId(8L)).thenReturn(Collections.emptyList());

        StaffDailyTasksResponse todayRes = staffDailyTaskService.getDailyTasks(8L, today, false, staffPrincipal);
        assertThat(todayRes.getCheckInTasks()).isEmpty();

        // 2. Khi xem ca trực ngày hẹn mới (futureDate): task XUẤT HIỆN chính xác
        when(staffDailyAssignmentRepository.findByStaffIdAndWorkDate(8L, futureDate))
                .thenReturn(List.of(assignment));
        when(userRepository.findById(15L)).thenReturn(Optional.of(sampleCustomer));
        when(storageUnitRepository.findById(101L)).thenReturn(Optional.of(sampleUnit));

        StaffDailyTasksResponse futureRes = staffDailyTaskService.getDailyTasks(8L, futureDate, false, staffPrincipal);
        assertThat(futureRes.getCheckInTasks()).hasSize(1);
        assertThat(futureRes.getCheckInTasks().get(0).getContractCode()).isEqualTo("CTR-RESCHEDULED");
        assertThat(futureRes.getCheckInTasks().get(0).getScheduledDate()).isEqualTo(futureDate);
    }
}
