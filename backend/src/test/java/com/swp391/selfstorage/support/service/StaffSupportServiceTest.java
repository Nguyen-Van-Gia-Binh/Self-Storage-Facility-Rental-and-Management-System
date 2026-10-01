package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.support.dto.AssignStaffRequest;
import com.swp391.selfstorage.support.dto.ResolveSupportRequest;
import com.swp391.selfstorage.support.dto.StaffWorkloadResponse;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.*;
import com.swp391.selfstorage.support.repository.AttachmentRepository;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StaffSupportServiceTest {

    @Mock
    private SupportRequestRepository supportRequestRepository;

    @Mock
    private StaffDailyAssignmentRepository staffDailyAssignmentRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

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

    @InjectMocks
    private StaffSupportServiceImpl staffSupportService;

    private UserPrincipal managerUser;
    private UserPrincipal staffUser;
    private SupportRequest sampleTicket;
    private RentalContract sampleContract;
    private AppUser sampleStaffEntity;

    @BeforeEach
    void setUp() {
        managerUser = new UserPrincipal(
                2L, "manager@storage.vn", "pass", "Lê Quản Lý Cơ Sở",
                UserRole.FACILITY_MANAGER, UserStatus.ACTIVE, List.of(1L), Collections.emptyList()
        );

        staffUser = new UserPrincipal(
                8L, "staff@storage.vn", "pass", "Trần Thị Nhân Viên",
                UserRole.FACILITY_STAFF, UserStatus.ACTIVE, List.of(1L), Collections.emptyList()
        );

        sampleContract = new RentalContract();
        sampleContract.setId(501L);
        sampleContract.setCode("CTR-202610-001");
        sampleContract.setCustomerId(15L);
        sampleContract.setFacilityId(1L);
        sampleContract.setStorageUnitId(42L);

        sampleTicket = SupportRequest.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .customerId(15L)
                .contractId(501L)
                .storageUnitId(42L)
                .category(SupportCategory.LOCK_ACCESS)
                .description("Mã PIN không mở được cửa ô kho")
                .status(SupportStatus.NEW)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        sampleStaffEntity = new AppUser();
        sampleStaffEntity.setId(8L);
        sampleStaffEntity.setFullName("Trần Thị Nhân Viên");
        sampleStaffEntity.setEmail("staff@storage.vn");
        sampleStaffEntity.setPhone("0912345678");
        sampleStaffEntity.setRole(UserRole.FACILITY_STAFF);
        sampleStaffEntity.setStatus(UserStatus.ACTIVE);
    }

    @Test
    @DisplayName("US-FM-05.1: Manager phân công nhân viên xử lý sự cố thành công")
    void shouldAssignStaff_successfully_byFacilityManager() {
        AssignStaffRequest request = AssignStaffRequest.builder()
                .staffId(8L)
                .note("Hỗ trợ mở cửa kho cho khách gấp")
                .build();

        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(sampleContract));
        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaffEntity));
        when(userFacilityAssignmentRepository.findByUserId(8L))
                .thenReturn(List.of(new UserFacilityAssignment(8L, 1L)));

        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(staffDailyAssignmentRepository.save(any(StaffDailyAssignment.class))).thenAnswer(i -> i.getArgument(0));

        Facility facility = new Facility();
        facility.setId(1L);
        facility.setName("Cơ sở Cầu Giấy");
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));

        SupportRequestDetailResponse response = staffSupportService.assignStaff(801L, request, managerUser);

        assertNotNull(response);
        assertEquals(SupportStatus.ASSIGNED, response.getStatus());
        assertEquals(8L, response.getAssignedStaffId());
        assertEquals("Trần Thị Nhân Viên", response.getAssignedStaffName());

        verify(supportRequestRepository).save(sampleTicket);
        verify(staffDailyAssignmentRepository).save(any(StaffDailyAssignment.class));
    }

    @Test
    @DisplayName("Bảo mật FM-05: Chặn Manager phân công ticket của cơ sở khác")
    void shouldRejectAssignStaff_whenManagerDoesNotManageFacility() {
        // Manager chỉ quản lý cơ sở 99, nhưng ticket thuộc cơ sở 1
        UserPrincipal otherManager = new UserPrincipal(
                3L, "other@storage.vn", "pass", "Nguyễn Quản Lý Q7",
                UserRole.FACILITY_MANAGER, UserStatus.ACTIVE, List.of(99L), Collections.emptyList()
        );

        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(sampleContract));

        AssignStaffRequest request = new AssignStaffRequest(8L, "Note");

        CustomException ex = assertThrows(CustomException.class, () ->
                staffSupportService.assignStaff(801L, request, otherManager)
        );

        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
        verify(supportRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-FM-05.1: Chặn phân công cho nhân viên không thuộc cơ sở của ticket")
    void shouldRejectAssignStaff_whenStaffNotInFacility() {
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(sampleContract));
        when(userRepository.findById(8L)).thenReturn(Optional.of(sampleStaffEntity));
        // Nhân viên 8 chỉ thuộc cơ sở 99, không thuộc cơ sở 1
        when(userFacilityAssignmentRepository.findByUserId(8L))
                .thenReturn(List.of(new UserFacilityAssignment(8L, 99L)));

        AssignStaffRequest request = new AssignStaffRequest(8L, "Note");

        CustomException ex = assertThrows(CustomException.class, () ->
                staffSupportService.assignStaff(801L, request, managerUser)
        );

        assertEquals(ErrorCode.STAFF_NOT_IN_FACILITY, ex.getErrorCode());
        verify(supportRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-FM-05.1: Chặn phân công khi nhân viên không tồn tại")
    void shouldRejectAssignStaff_whenStaffNotFound() {
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(sampleContract));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        AssignStaffRequest request = new AssignStaffRequest(999L, "Note");

        CustomException ex = assertThrows(CustomException.class, () ->
                staffSupportService.assignStaff(801L, request, managerUser)
        );

        assertEquals(ErrorCode.STAFF_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FS-05.2 AC-1: Nhân viên tiếp nhận kiểm tra tại hiện trường -> IN_PROGRESS")
    void shouldStartInProgress_successfully_byAssignedStaff() {
        sampleTicket.setStatus(SupportStatus.ASSIGNED);
        sampleTicket.setAssignedStaffId(8L);

        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(i -> i.getArgument(0));

        SupportRequestDetailResponse response = staffSupportService.startInProgress(801L, staffUser);

        assertNotNull(response);
        assertEquals(SupportStatus.IN_PROGRESS, response.getStatus());
        verify(supportRequestRepository).save(sampleTicket);
    }

    @Test
    @DisplayName("Bảo mật FS-05: Chặn nhân viên không được phân công bấm start in-progress")
    void shouldRejectStartInProgress_whenStaffNotAssigned() {
        sampleTicket.setStatus(SupportStatus.ASSIGNED);
        sampleTicket.setAssignedStaffId(99L); // Gán cho nhân viên 99

        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));

        CustomException ex = assertThrows(CustomException.class, () ->
                staffSupportService.startInProgress(801L, staffUser) // staffUser có id 8L
        );

        assertEquals(ErrorCode.SUPPORT_REQUEST_NOT_ASSIGNED_TO_STAFF, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FS-05.2 AC-2, AC-4: Nhân viên cập nhật kết quả xử lý thành công -> RESOLVED")
    void shouldResolveSupportRequest_successfully_withAttachmentsAndNote() {
        sampleTicket.setStatus(SupportStatus.IN_PROGRESS);
        sampleTicket.setAssignedStaffId(8L);

        ResolveSupportRequest request = ResolveSupportRequest.builder()
                .resolutionNote("Đã tra dầu bản lề cửa cuốn và cấp lại mã PIN mới")
                .resolutionAttachmentUrls(List.of("https://cdn.example.com/res1.jpg"))
                .build();

        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(attachmentRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        SupportRequestDetailResponse response = staffSupportService.resolveSupportRequest(801L, request, staffUser);

        assertNotNull(response);
        assertEquals(SupportStatus.CLOSED, response.getStatus());
        assertEquals("Đã tra dầu bản lề cửa cuốn và cấp lại mã PIN mới", response.getResolutionNote());
        assertNotNull(response.getResolvedAt());
        assertNotNull(response.getResolutionAttachmentUrls());
        assertEquals(1, response.getResolutionAttachmentUrls().size());

        verify(supportRequestRepository).save(sampleTicket);
        verify(attachmentRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("US-FS-05: Chặn resolve khi ticket chưa tiếp nhận (NEW) hoặc đã hoàn thành (CLOSED)")
    void shouldRejectResolve_whenTicketNotInAssignedOrInProgressStatus() {
        sampleTicket.setStatus(SupportStatus.NEW); // Chưa được gán/tiếp nhận
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));

        ResolveSupportRequest request = new ResolveSupportRequest("Ghi chú", null);

        CustomException ex = assertThrows(CustomException.class, () ->
                staffSupportService.resolveSupportRequest(801L, request, staffUser)
        );

        assertEquals(ErrorCode.SUPPORT_REQUEST_CANNOT_BE_RESOLVED, ex.getErrorCode());
        verify(supportRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-FS-05.2: Chặn resolve khi gửi quá 5 ảnh nghiệm thu")
    void shouldRejectResolve_whenMoreThan5Attachments() {
        sampleTicket.setStatus(SupportStatus.IN_PROGRESS);
        sampleTicket.setAssignedStaffId(8L);
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));

        ResolveSupportRequest request = new ResolveSupportRequest(
                "Đã sửa xong cửa cuốn",
                List.of("1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg")
        );

        CustomException ex = assertThrows(CustomException.class, () ->
                staffSupportService.resolveSupportRequest(801L, request, staffUser)
        );

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-FM-05.1 AC-3: Lấy danh sách Staff Workload theo cơ sở hiển thị chính xác")
    void shouldGetStaffWorkload_withCorrectActiveAndCompletedCounts() {
        Facility facility = new Facility();
        facility.setId(1L);
        facility.setName("Cơ sở Cầu Giấy");
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));

        when(userFacilityAssignmentRepository.findByUserId(anyLong()))
                .thenReturn(List.of(new UserFacilityAssignment(8L, 1L)));
        when(userRepository.findByFilters(isNull(), eq(UserRole.FACILITY_STAFF), eq(UserStatus.ACTIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleStaffEntity)));

        when(supportRequestRepository.countByAssignedStaffIdAndStatusIn(eq(8L), anyCollection()))
                .thenReturn(3L);
        when(supportRequestRepository.countByAssignedStaffIdAndStatus(eq(8L), eq(SupportStatus.RESOLVED)))
                .thenReturn(7L);

        List<StaffWorkloadResponse> workload = staffSupportService.getStaffWorkload(1L, managerUser);

        assertNotNull(workload);
        assertEquals(1, workload.size());
        StaffWorkloadResponse staffW = workload.get(0);
        assertEquals(8L, staffW.getStaffId());
        assertEquals("Trần Thị Nhân Viên", staffW.getStaffName());
        assertEquals(1L, staffW.getFacilityId());
        assertEquals(3L, staffW.getActiveTaskCount());
        assertEquals(7L, staffW.getCompletedTaskCount());
    }
}
