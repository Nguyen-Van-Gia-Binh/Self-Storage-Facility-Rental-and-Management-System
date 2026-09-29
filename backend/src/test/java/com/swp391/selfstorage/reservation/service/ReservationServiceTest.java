package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.reservation.dto.*;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @Mock private FacilityRepository facilityRepository;
    @Mock private UnitTypeRepository unitTypeRepository;
    @Mock private FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;
    @Mock private RentalContractRepository rentalContractRepository;
    @Mock private com.swp391.selfstorage.payment.repository.PaymentTransactionRepository paymentTransactionRepository;
    @Mock private PolicyVersionRepository policyVersionRepository;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private UserPrincipal customerUser;
    private Facility activeFacility;
    private UnitType activeUnitType;
    private StorageUnit availableStorageUnit;

    @BeforeEach
    void setUp() {
        customerUser = new UserPrincipal(
                15L, "customer@example.com", "password", "Nguyen Van Khach",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList()
        );

        activeFacility = new Facility();
        activeFacility.setId(1L);
        activeFacility.setName("Kho Thu Duc");
        activeFacility.setStatus(FacilityStatus.ACTIVE);

        activeUnitType = new UnitType();
        activeUnitType.setId(7L);
        activeUnitType.setName("Kho Size M");
        activeUnitType.setActive(true);

        availableStorageUnit = new StorageUnit();
        availableStorageUnit.setId(42L);
        availableStorageUnit.setFacilityId(1L);
        availableStorageUnit.setUnitTypeId(7L);
        availableStorageUnit.setCode("M-101");
        availableStorageUnit.setStatus(StorageUnitStatus.AVAILABLE);

        PolicyVersion policy = PolicyVersion.builder()
                .id(3L)
                .reservationHoldHours(48)
                .rentalBufferDays(15)
                .rentalDailyDivisor(30)
                .renewalMinMonths(1)
                .renewalMaxMonths(12)
                .cancelFullRefundHours(48)
                .cancelLateRefundRate(new BigDecimal("0.50"))
                .cancelNoShowRefundRate(BigDecimal.ZERO)
                .checkinGraceDays(10)
                .accessPinLength(6)
                .build();
        lenient().when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any()))
                .thenReturn(Optional.of(policy));
        lenient().when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(availableStorageUnit));
        lenient().when(rentalContractRepository.existsOverlappingContractForUnit(eq(42L), any(), any(), anyInt(), eq(0L)))
                .thenReturn(false);
    }

    @Test
    @DisplayName("BR-PRI-01 & BR-GEN-04: Tính giá đúng chiết khấu và tiền cọc 1 tháng làm tròn 1.000đ")
    void calculatePrice_ShouldCalculateCorrectly() {
        // 1 tháng, giá 1.200.000 đ
        CalculatePriceResponse res1 = reservationService.quote(1200000L, 1, BigDecimal.ONE);
        assertEquals(1200000L, res1.getRawRentTotal());
        assertEquals(0, res1.getDiscountAmount());
        assertEquals(1200000L, res1.getDepositAmount());
        assertEquals(2400000L, res1.getTotalDueToday());

        // 6 tháng -> chiết khấu 5%
        CalculatePriceResponse res6 = reservationService.quote(1200000L, 6, BigDecimal.ONE);
        assertEquals(7200000L, res6.getRawRentTotal());
        assertEquals(360000L, res6.getDiscountAmount());
        assertEquals(6840000L, res6.getFinalRentTotal());
        assertEquals(1200000L, res6.getDepositAmount());
        assertEquals(8040000L, res6.getTotalDueToday());

        // 12 tháng -> chiết khấu 10%
        CalculatePriceResponse res12 = reservationService.quote(1200000L, 12, BigDecimal.ONE);
        assertEquals(14400000L, res12.getRawRentTotal());
        assertEquals(1440000L, res12.getDiscountAmount());
        assertEquals(12960000L, res12.getFinalRentTotal());
        assertEquals(1200000L, res12.getDepositAmount());
        assertEquals(14160000L, res12.getTotalDueToday());
    }

    @Test
    @DisplayName("BR-DEP-01: Báo giá đọc đơn giá cơ sở và hệ số cọc của chính sách đang hiệu lực")
    void calculatePrice_UsesFacilityPriceAndPolicyMultiplier() {
        FacilityUnitTypePrice price = FacilityUnitTypePrice.builder()
                .facilityId(1L)
                .unitTypeId(7L)
                .monthlyPrice(800_000L)
                .build();
        when(facilityUnitTypePriceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(price));

        PolicyVersion pricedPolicy = PolicyVersion.builder()
                .id(3L)
                .reservationHoldHours(48)
                .rentalBufferDays(15)
                .depositMultiplier(new BigDecimal("1.50"))
                .build();
        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any()))
                .thenReturn(Optional.of(pricedPolicy));

        CalculatePriceResponse response = reservationService.calculatePrice(new CalculatePriceRequest(1L, 7L, 3));

        assertEquals(800_000L, response.getMonthlyPrice());
        assertEquals(2_400_000L, response.getRawRentTotal());
        assertEquals(1_200_000L, response.getDepositAmount());
        assertEquals(3_600_000L, response.getTotalDueToday());
    }

    @Test
    @DisplayName("createReservation ném UNAUTHORIZED khi currentUser là null")
    void createReservation_AnonymousUser_ThrowsUnauthorized() {
        CreateReservationRequest req = new CreateReservationRequest();
        req.setFacilityId(1L);
        req.setUnitTypeId(7L);
        req.setStartDate(LocalDate.now().plusDays(1));
        req.setRentalMonths(3);

        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.createReservation(req, null)
        );
        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        assertEquals("Vui lòng đăng nhập tài khoản để đặt chỗ lưu trữ.", ex.getMessage());
    }

    @Test
    @DisplayName("BR-OVD-09: Khách hàng có hợp đồng OVERDUE thì bị chặn đặt chỗ")
    void createReservation_CustomerHasOverdueContract_ShouldThrow() {
        when(rentalContractRepository.existsByCustomerIdAndStatus(15L, ContractStatus.OVERDUE)).thenReturn(true);

        CreateReservationRequest req = new CreateReservationRequest();
        req.setFacilityId(1L);
        req.setUnitTypeId(7L);
        req.setStartDate(LocalDate.now().plusDays(2));
        req.setRentalMonths(3);

        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.createReservation(req, customerUser)
        );
        assertEquals(ErrorCode.CONTRACT_OVERDUE, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-RES-01: Ngày bắt đầu ở quá khứ phải bị từ chối")
    void createReservation_PastStartDate_ShouldThrow() {
        when(rentalContractRepository.existsByCustomerIdAndStatus(15L, ContractStatus.OVERDUE)).thenReturn(false);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));

        CreateReservationRequest req = new CreateReservationRequest();
        req.setFacilityId(1L);
        req.setUnitTypeId(7L);
        req.setStartDate(LocalDate.now().minusDays(1));
        req.setRentalMonths(3);

        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.createReservation(req, customerUser)
        );
        assertEquals(ErrorCode.INVALID_START_DATE, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-RES-02 & BR-AVL-04: Ô kho đã có người giữ chỗ trùng lịch phải bị từ chối")
    void createReservation_SpecificUnit_OverlappingSlot_ShouldThrow() {
        when(rentalContractRepository.existsByCustomerIdAndStatus(15L, ContractStatus.OVERDUE)).thenReturn(false);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(availableStorageUnit));
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), eq(15)))
                .thenReturn(true);

        CreateReservationRequest req = new CreateReservationRequest();
        req.setFacilityId(1L);
        req.setUnitTypeId(7L);
        req.setStorageUnitId(42L);
        req.setStartDate(LocalDate.now().plusDays(1));
        req.setRentalMonths(3);

        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.createReservation(req, customerUser)
        );
        assertEquals(ErrorCode.UNIT_NOT_AVAILABLE, ex.getErrorCode());
    }

    @Test
    @DisplayName("SC-02 & BR-DEP-03: Tạo đơn đặt chỗ thành công và giữ chỗ 48 giờ")
    void createReservation_Success_ShouldHold48Hours() {
        when(rentalContractRepository.existsByCustomerIdAndStatus(15L, ContractStatus.OVERDUE)).thenReturn(false);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));
        when(storageUnitRepository.findByIdForUpdate(42L)).thenReturn(Optional.of(availableStorageUnit));
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), eq(15)))
                .thenReturn(false);

        FacilityUnitTypePrice price = new FacilityUnitTypePrice();
        price.setFacilityId(1L);
        price.setUnitTypeId(7L);
        price.setMonthlyPrice(1500000L);
        when(facilityUnitTypePriceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(price));

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(1042L);
            return r;
        });

        CreateReservationRequest req = new CreateReservationRequest();
        req.setFacilityId(1L);
        req.setUnitTypeId(7L);
        req.setStorageUnitId(42L);
        req.setStartDate(LocalDate.now().plusDays(2));
        req.setRentalMonths(3);

        ReservationResponse response = reservationService.createReservation(req, customerUser);

        assertNotNull(response);
        assertEquals(1042L, response.getId());
        assertEquals("PENDING_PAYMENT", response.getStatus());
        assertEquals(1500000L, response.getMonthlyPrice());
        assertEquals(1500000L, response.getDepositAmount());
        assertEquals(4500000L, response.getTotalRentalFee());
        assertEquals(6000000L, response.getTotalPayable());
        assertTrue(response.getHoldExpiresAt().isAfter(OffsetDateTime.now().plusHours(47)));
        assertTrue(response.getCode().startsWith("RSV-"));
    }

    @Test
    @DisplayName("Đặt chỗ từ chối số tháng ngoài khoảng chính sách đang hiệu lực")
    void createReservation_MonthsOutsidePolicy_ShouldThrow() {
        when(rentalContractRepository.existsByCustomerIdAndStatus(15L, ContractStatus.OVERDUE)).thenReturn(false);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));

        CreateReservationRequest req = new CreateReservationRequest();
        req.setFacilityId(1L);
        req.setUnitTypeId(7L);
        req.setStorageUnitId(42L);
        req.setStartDate(LocalDate.now().plusDays(2));
        req.setRentalMonths(15);

        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.createReservation(req, customerUser)
        );
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-RES-04: Hủy đơn đặt chỗ khi còn PENDING_PAYMENT thành công")
    void cancelReservation_Success_WhenPendingPayment() {
        Reservation r = new Reservation();
        r.setId(1042L);
        r.setCustomerId(15L);
        r.setFacilityId(1L);
        r.setUnitTypeId(7L);
        r.setStatus(ReservationStatus.PENDING_PAYMENT);

        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(r));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        CancelReservationRequest cancelReq = new CancelReservationRequest("Đổi sang kho khác");
        ReservationResponse result = reservationService.cancelReservation(1042L, cancelReq, customerUser);

        assertEquals("CANCELLED", result.getStatus());
        assertEquals("Đổi sang kho khác", result.getCancelReason());
        assertNotNull(result.getCancelledAt());
    }

    @Test
    @DisplayName("BR-RES-04 / AC-6: Không thể hủy đơn khi đã nhận kho (FULFILLED)")
    void cancelReservation_WhenFulfilled_ShouldThrow() {
        Reservation r = new Reservation();
        r.setId(1042L);
        r.setCustomerId(15L);
        r.setFacilityId(1L);
        r.setStatus(ReservationStatus.FULFILLED);

        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(r));

        CancelReservationRequest cancelReq = new CancelReservationRequest("Không muốn thuê nữa");
        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.cancelReservation(1042L, cancelReq, customerUser)
        );
        assertEquals(ErrorCode.RESERVATION_ALREADY_FULFILLED, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-CAN-01: Hủy đơn CONFIRMED trước >= 48h -> Hoàn 100% tiền thuê + 100% cọc")
    void cancelReservation_Success_WhenConfirmed_Early_FullRefund() {
        Reservation r = new Reservation();
        r.setId(1042L);
        r.setCustomerId(15L);
        r.setFacilityId(1L);
        r.setStatus(ReservationStatus.CONFIRMED);
        r.setStartDate(LocalDate.now().plusDays(5)); // >= 48h
        r.setDepositAmount(1_000_000L);
        r.setTotalPayable(4_000_000L);
        r.setStorageUnitId(88L);

        StorageUnit unit = new StorageUnit();
        unit.setId(88L);
        unit.setStatus(StorageUnitStatus.RESERVED);

        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(r));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storageUnitRepository.findById(88L)).thenReturn(Optional.of(unit));
        when(rentalContractRepository.findByReservationId(1042L)).thenReturn(Optional.empty());

        CancelReservationRequest cancelReq = new CancelReservationRequest("Đổi kế hoạch sớm");
        ReservationResponse result = reservationService.cancelReservation(1042L, cancelReq, customerUser);

        assertEquals("CANCELLED", result.getStatus());
        assertEquals(StorageUnitStatus.AVAILABLE, unit.getStatus());
        verify(paymentTransactionRepository).save(argThat(txn ->
                txn.getReservationId().equals(1042L)
                        && "REFUND".equals(txn.getTransactionType())
                        && "PENDING_REFUND".equals(txn.getStatus())
                        && txn.getAmount() == 4_000_000L
        ));
    }

    @Test
    @DisplayName("BR-CAN-02: Hủy đơn CONFIRMED trong vòng < 48h -> Hoàn 100% tiền thuê + 50% cọc")
    void cancelReservation_Success_WhenConfirmed_Late_PartialRefund() {
        Reservation r = new Reservation();
        r.setId(1042L);
        r.setCustomerId(15L);
        r.setFacilityId(1L);
        r.setStatus(ReservationStatus.CONFIRMED);
        r.setStartDate(LocalDate.now().plusDays(1)); // < 48h nhưng trước ngày bắt đầu
        r.setDepositAmount(1_000_000L);
        r.setTotalPayable(4_000_000L); // tiền thuê = 3M, cọc = 1M -> hoàn 3M + 500k = 3.5M

        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(r));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(rentalContractRepository.findByReservationId(1042L)).thenReturn(Optional.empty());

        CancelReservationRequest cancelReq = new CancelReservationRequest("Hủy sát ngày");
        ReservationResponse result = reservationService.cancelReservation(1042L, cancelReq, customerUser);

        assertEquals("CANCELLED", result.getStatus());
        verify(paymentTransactionRepository).save(argThat(txn ->
                txn.getReservationId().equals(1042L)
                        && "REFUND".equals(txn.getTransactionType())
                        && txn.getAmount() == 3_500_000L
        ));
    }

    @Test
    @DisplayName("SA-03: Khách hàng chỉ xem được danh sách đơn đặt chỗ của chính mình")
    void getReservations_CustomerRole_ShouldFilterByOwnId() {
        Reservation r = new Reservation();
        r.setId(1042L);
        r.setCustomerId(15L);
        r.setFacilityId(1L);
        r.setUnitTypeId(7L);
        r.setStatus(ReservationStatus.PENDING_PAYMENT);

        Page<Reservation> page = new PageImpl<>(List.of(r));
        when(reservationRepository.findWithFilters(eq(15L), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));

        ReservationFilterParams params = new ReservationFilterParams();
        params.setPage(0);
        params.setSize(10);

        PageResponse<ReservationResponse> response = reservationService.getReservations(params, customerUser);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals(15L, response.getContent().get(0).getCustomerId());
    }
}
