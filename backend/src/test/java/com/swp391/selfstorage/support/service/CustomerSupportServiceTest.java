package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.support.dto.ConfirmResolutionRequest;
import com.swp391.selfstorage.support.dto.CreateSupportRequest;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.Attachment;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportRequest;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.repository.AttachmentRepository;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
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
class CustomerSupportServiceTest {

    @Mock
    private SupportRequestRepository supportRequestRepository;

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
    private com.swp391.selfstorage.policy.repository.PolicyVersionRepository policyVersionRepository;

    @InjectMocks
    private CustomerSupportServiceImpl customerSupportService;

    private UserPrincipal customerUser;
    private SupportRequest sampleTicket;

    @BeforeEach
    void setUp() {
        customerUser = new UserPrincipal(
                15L, "customer@example.com", "pass", "Nguyễn Văn Khách",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList()
        );

        sampleTicket = SupportRequest.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .customerId(15L)
                .contractId(501L)
                .storageUnitId(42L)
                .category(SupportCategory.LOCK_ACCESS)
                .description("Mã PIN không mở được cửa ô kho")
                .status(SupportStatus.NEW)
                .isUrgent(true)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("US-SC-06.1 & BR-SUP-01: Tạo ticket LOCK_ACCESS thành công không áp đặt SLA cứng 2 giờ")
    void shouldCreateLockAccessSupportRequest_withoutEnforcingSla_andGenerateCode() {
        CreateSupportRequest request = CreateSupportRequest.builder()
                .contractId(501L)
                .storageUnitId(42L)
                .category(SupportCategory.LOCK_ACCESS)
                .description("Quên mã PIN và bàn phím khóa bị kẹt")
                .isUrgent(false)
                .build();

        RentalContract contract = new RentalContract();
        contract.setId(501L);
        contract.setCode("CTR-202610-001");
        contract.setCustomerId(15L);
        contract.setFacilityId(1L);
        contract.setStorageUnitId(42L);

        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(contract));
        when(supportRequestRepository.countByCodeStartingWith(anyString())).thenReturn(0L);
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(invocation -> {
            SupportRequest saved = invocation.getArgument(0);
            saved.setId(801L);
            return saved;
        });

        Facility facility = new Facility();
        facility.setId(1L);
        facility.setName("Cơ sở Quận 7");
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));

        StorageUnit unit = new StorageUnit();
        unit.setId(42L);
        unit.setCode("U-101");
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(unit));

        SupportRequestDetailResponse response = customerSupportService.createSupportRequest(request, customerUser);

        assertNotNull(response);
        assertEquals(801L, response.getId());
        assertTrue(response.getCode().startsWith("SUP-"));
        assertEquals(SupportStatus.NEW, response.getStatus());
        assertFalse(response.getIsUrgent());
        assertNull(response.getSlaDueAt());

        verify(supportRequestRepository).save(any(SupportRequest.class));
    }

    @Test
    @DisplayName("US-SC-06.1 AC-3: Tạo ticket kèm ảnh đính kèm thành công")
    void shouldCreateSupportRequest_withAttachments_successfully() {
        CreateSupportRequest request = CreateSupportRequest.builder()
                .category(SupportCategory.UNIT_DAMAGE)
                .description("Tường kho có vết nứt và thấm nước mưa")
                .isUrgent(false)
                .attachmentUrls(List.of("https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg"))
                .build();

        when(supportRequestRepository.countByCodeStartingWith(anyString())).thenReturn(5L);
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(invocation -> {
            SupportRequest saved = invocation.getArgument(0);
            saved.setId(802L);
            return saved;
        });

        when(attachmentRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));

        SupportRequestDetailResponse response = customerSupportService.createSupportRequest(request, customerUser);

        assertNotNull(response);
        assertEquals(802L, response.getId());
        assertNotNull(response.getAttachmentUrls());
        assertEquals(2, response.getAttachmentUrls().size());
        verify(attachmentRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("US-SC-06.1 AC-3: Chặn tạo ticket khi vượt quá 5 ảnh đính kèm")
    void shouldRejectCreation_whenMoreThan5Attachments() {
        CreateSupportRequest request = CreateSupportRequest.builder()
                .category(SupportCategory.OTHER)
                .description("Vấn đề khác với tài sản trong kho lưu trữ")
                .attachmentUrls(List.of("1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"))
                .build();

        CustomException ex = assertThrows(CustomException.class, () ->
                customerSupportService.createSupportRequest(request, customerUser)
        );

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        verify(supportRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-SC-06.2: Lấy danh sách yêu cầu hỗ trợ phân trang của khách hàng")
    void shouldReturnMySupportRequests_withPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        when(supportRequestRepository.findByCustomerId(eq(15L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleTicket), pageable, 1));

        PageResponse<SupportRequestSummaryResponse> response = customerSupportService.getMySupportRequests(
                customerUser, null, null, pageable
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("SUP-202610-0001", response.getContent().get(0).getCode());
    }

    @Test
    @DisplayName("US-SC-06.2: Xem chi tiết yêu cầu hỗ trợ thuộc sở hữu của khách")
    void shouldGetSupportRequestDetail_whenOwnedByCustomer() {
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(attachmentRepository.findByEntityTypeAndEntityId("SUPPORT_REQUEST", 801L))
                .thenReturn(List.of(new Attachment(1L, "SUPPORT_REQUEST", 801L, "https://cdn.example.com/pic1.jpg", 15L, OffsetDateTime.now())));

        SupportRequestDetailResponse response = customerSupportService.getSupportRequestDetail(801L, customerUser);

        assertNotNull(response);
        assertEquals("SUP-202610-0001", response.getCode());
        assertEquals(1, response.getAttachmentUrls().size());
        assertTrue(response.isCanCancel()); // Status NEW có thể hủy
    }

    @Test
    @DisplayName("Bảo mật: Chặn xem ticket của khách hàng khác")
    void shouldThrowAccessDenied_whenSupportRequestNotOwnedByCustomer() {
        sampleTicket.setCustomerId(99L); // Ticket thuộc khách hàng 99
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));

        CustomException ex = assertThrows(CustomException.class, () ->
                customerSupportService.getSupportRequestDetail(801L, customerUser)
        );

        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-06.3: Khách hàng xác nhận hài lòng -> đóng ticket CLOSED")
    void shouldConfirmResolution_satisfied_closesTicket() {
        sampleTicket.setStatus(SupportStatus.RESOLVED);
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(i -> i.getArgument(0));

        ConfirmResolutionRequest confirmReq = ConfirmResolutionRequest.builder()
                .satisfied(true)
                .feedback("Nhân viên đã đến hỗ trợ mở khóa nhanh chóng")
                .build();

        SupportRequestDetailResponse response = customerSupportService.confirmResolution(801L, confirmReq, customerUser);

        assertNotNull(response);
        assertEquals(SupportStatus.CLOSED, response.getStatus());
        assertNotNull(response.getCustomerConfirmedAt());
    }

    @Test
    @DisplayName("US-SC-06.3: Khách hàng báo chưa giải quyết được -> quay lại IN_PROGRESS")
    void shouldConfirmResolution_notSatisfied_returnsToInProgress() {
        sampleTicket.setStatus(SupportStatus.RESOLVED);
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(i -> i.getArgument(0));

        ConfirmResolutionRequest confirmReq = ConfirmResolutionRequest.builder()
                .satisfied(false)
                .feedback("Khóa vẫn chưa mở được sau khi reset")
                .build();

        SupportRequestDetailResponse response = customerSupportService.confirmResolution(801L, confirmReq, customerUser);

        assertNotNull(response);
        assertEquals(SupportStatus.IN_PROGRESS, response.getStatus());
        assertNull(response.getCustomerConfirmedAt());
    }

    @Test
    @DisplayName("US-SC-06: Hủy ticket khi còn ở trạng thái NEW")
    void shouldCancelSupportRequest_whenStatusIsNew() {
        sampleTicket.setStatus(SupportStatus.NEW);
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));

        assertDoesNotThrow(() -> customerSupportService.cancelSupportRequest(801L, customerUser));

        verify(attachmentRepository).deleteByEntityTypeAndEntityId("SUPPORT_REQUEST", 801L);
        verify(supportRequestRepository).delete(sampleTicket);
    }

    @Test
    @DisplayName("US-SC-06: Chặn hủy ticket khi đã được tiếp nhận (ASSIGNED)")
    void shouldRejectCancel_whenStatusIsNotNew() {
        sampleTicket.setStatus(SupportStatus.ASSIGNED);
        when(supportRequestRepository.findById(801L)).thenReturn(Optional.of(sampleTicket));

        CustomException ex = assertThrows(CustomException.class, () ->
                customerSupportService.cancelSupportRequest(801L, customerUser)
        );

        assertEquals(ErrorCode.SUPPORT_REQUEST_CANNOT_BE_CANCELLED, ex.getErrorCode());
        verify(supportRequestRepository, never()).delete(any());
    }

    @Test
    @DisplayName("US-SC-06: Chặn tạo ticket khi hợp đồng đã TERMINATED hoặc CLOSED")
    void shouldRejectCreate_whenContractIsTerminatedOrClosed() {
        CreateSupportRequest request = CreateSupportRequest.builder()
                .contractId(501L)
                .category(SupportCategory.LOCK_ACCESS)
                .description("Báo hỏng khóa ô kho")
                .isUrgent(false)
                .build();

        RentalContract terminatedContract = new RentalContract();
        terminatedContract.setId(501L);
        terminatedContract.setCustomerId(15L);
        terminatedContract.setStatus(ContractStatus.TERMINATED);

        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(terminatedContract));

        CustomException ex = assertThrows(CustomException.class, () ->
                customerSupportService.createSupportRequest(request, customerUser)
        );

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        verify(supportRequestRepository, never()).save(any());
    }

    @Test
    @DisplayName("US-SC-06: Chặn tạo ticket khi hợp đồng không thuộc quyền sở hữu của khách hàng")
    void shouldRejectCreate_whenContractDoesNotBelongToCustomer() {
        CreateSupportRequest request = CreateSupportRequest.builder()
                .contractId(501L)
                .category(SupportCategory.LOCK_ACCESS)
                .description("Báo hỏng khóa ô kho khác")
                .isUrgent(false)
                .build();

        RentalContract otherContract = new RentalContract();
        otherContract.setId(501L);
        otherContract.setCustomerId(999L); // ID khác với customerUser (15L)
        otherContract.setStatus(ContractStatus.ACTIVE);

        when(rentalContractRepository.findById(501L)).thenReturn(Optional.of(otherContract));

        CustomException ex = assertThrows(CustomException.class, () ->
                customerSupportService.createSupportRequest(request, customerUser)
        );

        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
        verify(supportRequestRepository, never()).save(any());
    }
}

