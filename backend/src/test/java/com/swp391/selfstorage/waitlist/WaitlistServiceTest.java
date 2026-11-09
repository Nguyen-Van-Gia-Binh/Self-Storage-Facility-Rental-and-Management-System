package com.swp391.selfstorage.waitlist;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.contract.dto.ContractResponse;
import com.swp391.selfstorage.contract.service.ContractService;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.waitlist.dto.ConvertWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.ConvertWaitlistToContractRequest;
import com.swp391.selfstorage.waitlist.dto.CreateWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.FollowUpWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.RejectWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.WaitlistResponse;
import com.swp391.selfstorage.waitlist.entity.Waitlist;
import com.swp391.selfstorage.waitlist.entity.WaitlistStatus;
import com.swp391.selfstorage.waitlist.repository.WaitlistRepository;
import com.swp391.selfstorage.waitlist.service.WaitlistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaitlistServiceTest {

    @Mock
    private WaitlistRepository waitlistRepository;
    @Mock
    private FacilityRepository facilityRepository;
    @Mock
    private UnitTypeRepository unitTypeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StorageUnitRepository storageUnitRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private PolicyVersionRepository policyVersionRepository;
    @Mock
    private FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;
    @Mock
    private ContractService contractService;

    @InjectMocks
    private WaitlistServiceImpl waitlistService;

    private UserPrincipal customerUser;
    private UserPrincipal fmUser;
    private Facility activeFacility;
    private UnitType activeUnitType;
    private PolicyVersion policyVersion;

    @BeforeEach
    void setUp() {
        customerUser = new UserPrincipal(10L, "customer@example.com", "pass", "Khách Hàng A",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList());
        fmUser = new UserPrincipal(20L, "fm@example.com", "pass", "Quản Lý Cơ Sở B",
                UserRole.FACILITY_MANAGER, UserStatus.ACTIVE, Collections.singletonList(1L), Collections.emptyList());

        activeFacility = new Facility();
        activeFacility.setId(1L);
        activeFacility.setCode("FAC-Q7");
        activeFacility.setName("Cơ sở Quận 7");
        activeFacility.setStatus(FacilityStatus.ACTIVE);

        activeUnitType = new UnitType();
        activeUnitType.setId(5L);
        activeUnitType.setCode("M");
        activeUnitType.setName("Kho Vừa (Medium)");
        activeUnitType.setActive(true);

        policyVersion = new PolicyVersion();
        policyVersion.setId(100L);
        policyVersion.setDepositMultiplier(BigDecimal.ONE);
        policyVersion.setRentalBufferDays(0);
        policyVersion.setReservationHoldHours(24);

        ReflectionTestUtils.setField(waitlistService, "facilityUnitTypePriceRepository", facilityUnitTypePriceRepository);
        ReflectionTestUtils.setField(waitlistService, "contractService", contractService);
    }

    @Test
    @DisplayName("registerWaitlist: Đăng ký hàng đợi thành công khi hết chỗ trong 30 ngày")
    void registerWaitlist_Success() {
        CreateWaitlistRequest request = CreateWaitlistRequest.builder()
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(5))
                .rentalMonths(2)
                .phoneNumber("0912345678")
                .build();

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(5L)).thenReturn(Optional.of(activeUnitType));
        when(waitlistRepository.existsByCustomerIdAndFacilityIdAndUnitTypeIdAndStatusIn(anyLong(), anyLong(), anyLong(), any()))
                .thenReturn(false);

        // Giả lập kho đã hết chỗ (exploitable = 5, busy = 5 -> available = 0)
        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(5L), any())).thenReturn(5L);
        when(storageUnitRepository.countBusyUnits(eq(1L), eq(5L), any(), any(), anyInt())).thenReturn(5L);
        when(reservationRepository.countUnassignedOverlappingReservations(eq(1L), eq(5L), any(), any(), any(), anyInt())).thenReturn(0L);

        Waitlist savedWaitlist = Waitlist.builder()
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(5))
                .rentalMonths(2)
                .status(WaitlistStatus.WAITING)
                .contactPhone("0912345678")
                .build();
        savedWaitlist.setId(99L);

        when(waitlistRepository.save(any(Waitlist.class))).thenReturn(savedWaitlist);

        WaitlistResponse response = waitlistService.registerWaitlist(request, customerUser);

        assertNotNull(response);
        assertEquals(99L, response.getId());
        assertEquals(WaitlistStatus.WAITING, response.getStatus());
        assertEquals("0912345678", response.getCustomerPhone());
        verify(waitlistRepository, times(1)).save(any(Waitlist.class));
    }

    @Test
    @DisplayName("registerWaitlist: Từ chối vào Waitlist nếu trong 30 ngày vẫn còn ô kho trống (khuyên đặt trực tiếp)")
    void registerWaitlist_CapacityAvailable_ThrowsException() {
        CreateWaitlistRequest request = CreateWaitlistRequest.builder()
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(5))
                .rentalMonths(2)
                .phoneNumber("0912345678")
                .build();

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(5L)).thenReturn(Optional.of(activeUnitType));
        when(waitlistRepository.existsByCustomerIdAndFacilityIdAndUnitTypeIdAndStatusIn(anyLong(), anyLong(), anyLong(), any()))
                .thenReturn(false);

        // Giả lập kho còn chỗ (exploitable = 5, busy = 2 -> available = 3)
        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(5L), any())).thenReturn(5L);
        when(storageUnitRepository.countBusyUnits(eq(1L), eq(5L), any(), any(), anyInt())).thenReturn(2L);
        when(reservationRepository.countUnassignedOverlappingReservations(eq(1L), eq(5L), any(), any(), any(), anyInt())).thenReturn(0L);

        CustomException ex = assertThrows(CustomException.class, () ->
                waitlistService.registerWaitlist(request, customerUser));
        assertEquals(ErrorCode.CAPACITY_AVAILABLE_SHOULD_BOOK_NOW, ex.getErrorCode());
    }

    @Test
    @DisplayName("registerWaitlist: Chấp nhận khi targetStartDate vượt quá 30 ngày (đặt trước dài hạn)")
    void registerWaitlist_Exceeds30Days_Success() {
        CreateWaitlistRequest request = CreateWaitlistRequest.builder()
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(45))
                .rentalMonths(2)
                .phoneNumber("0912345678")
                .build();

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(5L)).thenReturn(Optional.of(activeUnitType));
        when(waitlistRepository.existsByCustomerIdAndFacilityIdAndUnitTypeIdAndStatusIn(anyLong(), anyLong(), anyLong(), any()))
                .thenReturn(false);

        Waitlist mockSaved = Waitlist.builder()
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(45))
                .rentalMonths(2)
                .status(WaitlistStatus.WAITING)
                .contactPhone("0912345678")
                .build();
        mockSaved.setId(99L);
        when(waitlistRepository.save(any(Waitlist.class))).thenReturn(mockSaved);

        WaitlistResponse response = waitlistService.registerWaitlist(request, customerUser);
        assertNotNull(response);
        assertEquals(WaitlistStatus.WAITING, response.getStatus());
        verify(waitlistRepository).save(any(Waitlist.class));
    }

    @Test
    @DisplayName("registerWaitlist: Chặn đăng ký trùng lặp nếu đã có đơn đang chờ")
    void registerWaitlist_Duplicate_ThrowsConflict() {
        CreateWaitlistRequest request = CreateWaitlistRequest.builder()
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(5))
                .rentalMonths(2)
                .phoneNumber("0912345678")
                .build();

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(5L)).thenReturn(Optional.of(activeUnitType));
        when(waitlistRepository.existsByCustomerIdAndFacilityIdAndUnitTypeIdAndStatusIn(eq(10L), eq(1L), eq(5L), any()))
                .thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () ->
                waitlistService.registerWaitlist(request, customerUser));

        assertEquals(ErrorCode.WAITLIST_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("startContacting: Khóa cuộc gọi độc quyền 2 giờ thành công")
    void startContacting_Success() {
        when(waitlistRepository.atomicStartContacting(eq(99L), eq(WaitlistStatus.CONTACTING), eq(20L), any(), any(), any()))
                .thenReturn(1);

        Waitlist lockedWaitlist = Waitlist.builder()
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(5))
                .rentalMonths(2)
                .status(WaitlistStatus.CONTACTING)
                .assignedFmId(20L)
                .contactTimeoutAt(OffsetDateTime.now(ZoneOffset.UTC).plusHours(2))
                .build();
        lockedWaitlist.setId(99L);

        when(waitlistRepository.findById(99L)).thenReturn(Optional.of(lockedWaitlist));

        WaitlistResponse response = waitlistService.startContacting(99L, fmUser);

        assertNotNull(response);
        assertEquals(WaitlistStatus.CONTACTING, response.getStatus());
        assertEquals(20L, response.getAssignedFmId());
    }

    @Test
    @DisplayName("startContacting: Xung đột khi FM khác đã khóa -> Ném lỗi WAITLIST_LOCK_CONFLICT")
    void startContacting_RaceCondition_ThrowsConflict() {
        when(waitlistRepository.atomicStartContacting(eq(99L), eq(WaitlistStatus.CONTACTING), eq(20L), any(), any(), any()))
                .thenReturn(0);

        CustomException ex = assertThrows(CustomException.class, () ->
                waitlistService.startContacting(99L, fmUser));

        assertEquals(ErrorCode.WAITLIST_LOCK_CONFLICT, ex.getErrorCode());
    }

    @Test
    @DisplayName("convertToReservation: Thành công khi kho còn Capacity -> Tạo Reservation 24h và Waitlist chuyển CONVERTED")
    void convertToReservation_CapacityAvailable_Success() {
        Waitlist waitlist = Waitlist.builder()
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(2))
                .rentalMonths(3)
                .status(WaitlistStatus.CONTACTING)
                .assignedFmId(20L)
                .build();
        waitlist.setId(99L);

        when(waitlistRepository.findById(99L)).thenReturn(Optional.of(waitlist));
        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any()))
                .thenReturn(Optional.of(policyVersion));

        // Capacity check: exploitable(5) - busy(2) - unassigned(1) = 2 > 0 -> OK
        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(5L), any())).thenReturn(5L);
        when(storageUnitRepository.countBusyUnits(eq(1L), eq(5L), any(), any(), anyInt())).thenReturn(2L);
        when(reservationRepository.countUnassignedOverlappingReservations(eq(1L), eq(5L), any(), any(), any(), anyInt()))
                .thenReturn(1L);

        FacilityUnitTypePrice price = new FacilityUnitTypePrice();
        price.setMonthlyPrice(500000L);
        when(facilityUnitTypePriceRepository.findByFacilityIdAndUnitTypeId(1L, 5L)).thenReturn(Optional.of(price));

        Reservation savedReservation = new Reservation();
        savedReservation.setId(888L);
        savedReservation.setCode("RSV-20261106-1234");
        when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);
        when(waitlistRepository.save(any(Waitlist.class))).thenReturn(waitlist);

        ConvertWaitlistRequest convertReq = ConvertWaitlistRequest.builder()
                .startDate(LocalDate.now().plusDays(2))
                .rentalMonths(3)
                .build();

        WaitlistResponse response = waitlistService.convertToReservation(99L, convertReq, fmUser);

        assertNotNull(response);
        assertEquals(WaitlistStatus.CONVERTED, waitlist.getStatus());
        assertEquals(888L, waitlist.getConvertedReservationId());
        verify(reservationRepository, times(1)).save(any(Reservation.class));
    }

    @Test
    @DisplayName("convertToReservation: Thất bại khi kho hết Capacity -> Ném 409 CAPACITY_NOT_AVAILABLE, không đổi sang CONVERTED")
    void convertToReservation_CapacityZero_ThrowsConflict() {
        Waitlist waitlist = Waitlist.builder()
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(2))
                .rentalMonths(3)
                .status(WaitlistStatus.CONTACTING)
                .assignedFmId(20L)
                .build();
        waitlist.setId(99L);

        when(waitlistRepository.findById(99L)).thenReturn(Optional.of(waitlist));
        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any()))
                .thenReturn(Optional.of(policyVersion));

        // Capacity check: exploitable(5) - busy(4) - unassigned(1) = 0 -> Hết chỗ!
        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(5L), any())).thenReturn(5L);
        when(storageUnitRepository.countBusyUnits(eq(1L), eq(5L), any(), any(), anyInt())).thenReturn(4L);
        when(reservationRepository.countUnassignedOverlappingReservations(eq(1L), eq(5L), any(), any(), any(), anyInt()))
                .thenReturn(1L);

        ConvertWaitlistRequest convertReq = ConvertWaitlistRequest.builder()
                .startDate(LocalDate.now().plusDays(2))
                .rentalMonths(3)
                .build();

        CustomException ex = assertThrows(CustomException.class, () ->
                waitlistService.convertToReservation(99L, convertReq, fmUser));

        assertEquals(ErrorCode.CAPACITY_NOT_AVAILABLE, ex.getErrorCode());
        // Bảo toàn trạng thái: Không được đổi sang CONVERTED
        assertEquals(WaitlistStatus.CONTACTING, waitlist.getStatus());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    @DisplayName("convertToContract: Thành công khi FM tạo hợp đồng trực tiếp từ đơn chờ")
    void convertToContract_Success() {
        Waitlist waitlist = Waitlist.builder()
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(5L)
                .targetStartDate(LocalDate.now().plusDays(2))
                .rentalMonths(3)
                .status(WaitlistStatus.CONTACTING)
                .assignedFmId(20L)
                .build();
        waitlist.setId(99L);

        when(waitlistRepository.findById(99L)).thenReturn(Optional.of(waitlist));
        when(contractService.createDirectContract(any(), eq(fmUser))).thenReturn(new ContractResponse());

        ConvertWaitlistToContractRequest convertReq = ConvertWaitlistToContractRequest.builder()
                .startDate(LocalDate.now().plusDays(2))
                .rentalMonths(3)
                .paymentMethod("CASH")
                .notes("Đã chốt hợp đồng trực tiếp tại quầy")
                .build();

        WaitlistResponse response = waitlistService.convertToContract(99L, convertReq, fmUser);
        assertNotNull(response);
        verify(contractService).createDirectContract(any(), eq(fmUser));
    }

    @Test
    @DisplayName("followUp: FM hẹn gọi lại -> Chuyển sang PENDING_FOLLOW_UP và giải phóng khóa tư vấn")
    void followUp_Success() {
        Waitlist waitlist = Waitlist.builder()
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(5L)
                .status(WaitlistStatus.CONTACTING)
                .assignedFmId(20L)
                .build();
        waitlist.setId(99L);

        when(waitlistRepository.findById(99L)).thenReturn(Optional.of(waitlist));
        when(waitlistRepository.save(any(Waitlist.class))).thenReturn(waitlist);

        FollowUpWaitlistRequest req = FollowUpWaitlistRequest.builder()
                .contactNotes("Khách đang họp, hẹn 15h gọi lại")
                .build();

        WaitlistResponse response = waitlistService.followUp(99L, req, fmUser);

        assertNotNull(response);
        assertEquals(WaitlistStatus.PENDING_FOLLOW_UP, waitlist.getStatus());
        assertNull(waitlist.getAssignedFmId());
        assertEquals("Khách đang họp, hẹn 15h gọi lại", waitlist.getContactNotes());
    }

    @Test
    @DisplayName("reject: FM ghi nhận từ chối -> Chuyển sang REJECTED kèm lý do")
    void reject_Success() {
        Waitlist waitlist = Waitlist.builder()
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(5L)
                .status(WaitlistStatus.CONTACTING)
                .assignedFmId(20L)
                .build();
        waitlist.setId(99L);

        when(waitlistRepository.findById(99L)).thenReturn(Optional.of(waitlist));
        when(waitlistRepository.save(any(Waitlist.class))).thenReturn(waitlist);

        RejectWaitlistRequest req = RejectWaitlistRequest.builder()
                .reason("Khách đã thuê chỗ khác gần nhà hơn")
                .build();

        WaitlistResponse response = waitlistService.reject(99L, req, fmUser);

        assertNotNull(response);
        assertEquals(WaitlistStatus.REJECTED, waitlist.getStatus());
        assertEquals("Khách đã thuê chỗ khác gần nhà hơn", waitlist.getContactNotes());
    }

    @Test
    @DisplayName("cleanupExpiredLocks: Giải phóng các bản ghi CONTACTING quá hạn")
    void cleanupExpiredLocks_Success() {
        when(waitlistRepository.unlockExpiredContacting(eq(WaitlistStatus.WAITING), eq(WaitlistStatus.CONTACTING), any()))
                .thenReturn(3);

        int unlocked = waitlistService.cleanupExpiredLocks();

        assertEquals(3, unlocked);
        verify(waitlistRepository, times(1)).unlockExpiredContacting(any(), any(), any());
    }
}
