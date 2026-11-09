package com.swp391.selfstorage.contract.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.ContractResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.service.impl.ContractServiceImpl;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.reservation.dto.CancelReservationRequest;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ContractCancelPendingServiceTest {

    @Mock
    private RentalContractRepository contractRepository;
    @Mock
    private StorageUnitRepository storageUnitRepository;
    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ContractServiceImpl contractService;

    private RentalContract contract;
    private StorageUnit unit;
    private Reservation reservation;
    private UserPrincipal customerUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(contractService, "paymentTransactionRepository", paymentTransactionRepository);
        ReflectionTestUtils.setField(contractService, "userRepository", userRepository);

        AppUser appUser = new AppUser();
        appUser.setId(10L);
        appUser.setEmail("customer@test.com");
        appUser.setRole(UserRole.STORAGE_CUSTOMER);
        customerUser = UserPrincipal.create(appUser, List.of(1L));

        contract = RentalContract.builder()
                .id(100L)
                .code("CTR-20261107-001")
                .customerId(10L)
                .facilityId(1L)
                .unitTypeId(2L)
                .storageUnitId(201L)
                .reservationId(500L)
                .startDate(LocalDate.now().plusDays(10))
                .endDateExclusive(LocalDate.now().plusDays(10).plusMonths(1))
                .rentalMonths(1)
                .monthlyPrice(1_500_000L)
                .totalRentalFee(1_500_000L)
                .depositAmount(1_500_000L)
                .depositBalance(1_500_000L)
                .status(ContractStatus.PENDING_CHECK_IN)
                .createdAt(OffsetDateTime.now().minusDays(3))
                .build();

        unit = StorageUnit.builder()
                .id(201L)
                .code("Q1-U201")
                .facilityId(1L)
                .unitTypeId(2L)
                .status(StorageUnitStatus.RESERVED)
                .build();

        reservation = new Reservation();
        reservation.setId(500L);
        reservation.setStatus(ReservationStatus.CONFIRMED);

        when(contractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(storageUnitRepository.findById(201L)).thenReturn(Optional.of(unit));
        when(reservationRepository.findById(500L)).thenReturn(Optional.of(reservation));
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("BR-CAN-01: Hủy sớm trước >= 7 ngày -> Hoàn 100% tiền cọc và 100% tiền thuê")
    void cancel_Tier1_FullRefund_WhenMoreThan7DaysBeforeStart() {
        // Ngày bắt đầu sau 10 ngày (>= 7 ngày)
        contract.setStartDate(LocalDate.now().plusDays(10));
        CancelReservationRequest req = new CancelReservationRequest("Thay đổi kế hoạch cá nhân");

        ContractResponse response = contractService.cancelPendingContract(100L, req, customerUser);

        assertEquals(ContractStatus.CANCELLED, contract.getStatus());
        assertEquals(StorageUnitStatus.AVAILABLE, unit.getStatus());
        assertEquals(ReservationStatus.CANCELLED, reservation.getStatus());

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository, atLeastOnce()).save(captor.capture());
        long total = captor.getAllValues().stream().mapToLong(PaymentTransaction::getAmount).sum();
        assertEquals(3_000_000L, total);
        assertTrue(captor.getAllValues().stream().anyMatch(t -> "RENT_REFUND".equals(t.getTransactionType())));
        assertTrue(captor.getAllValues().stream().anyMatch(t -> "DEPOSIT_REFUND".equals(t.getTransactionType())));
    }

    @Test
    @DisplayName("BR-CAN-01: Hủy trong 48h đầu sau thanh toán (Cooling-off) -> Luôn hoàn 100% dù ngày bắt đầu sát")
    void cancel_Tier1_FullRefund_WhenWithinCoolingOff() {
        // Hợp đồng tạo cách đây 12 giờ (< 48h cooling-off), ngày bắt đầu vào ngày mai (< 48h)
        contract.setCreatedAt(OffsetDateTime.now().minusHours(12));
        contract.setStartDate(LocalDate.now().plusDays(1));
        CancelReservationRequest req = new CancelReservationRequest("Đổi ý trong 48h đầu");

        contractService.cancelPendingContract(100L, req, customerUser);

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository, atLeastOnce()).save(captor.capture());
        long total = captor.getAllValues().stream().mapToLong(PaymentTransaction::getAmount).sum();
        assertEquals(3_000_000L, total);
    }

    @Test
    @DisplayName("BR-CAN-02: Hủy lửng từ 2 đến 6 ngày trước ngày bắt đầu -> Phạt 50% cọc, hoàn 50% cọc + 100% thuê")
    void cancel_Tier2_MidRefund_WhenBetween2And6DaysBeforeStart() {
        // Hợp đồng tạo cách đây 4 ngày (hết cooling-off), ngày bắt đầu sau 4 ngày (khoảng 96 giờ)
        contract.setCreatedAt(OffsetDateTime.now().minusDays(4));
        contract.setStartDate(LocalDate.now().plusDays(4));
        CancelReservationRequest req = new CancelReservationRequest("Hủy trước 4 ngày");

        contractService.cancelPendingContract(100L, req, customerUser);

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository, atLeastOnce()).save(captor.capture());
        long total = captor.getAllValues().stream().mapToLong(PaymentTransaction::getAmount).sum();
        assertEquals(2_250_000L, total);
    }

    @Test
    @DisplayName("BR-CAN-03: Hủy sát nút dưới 48 giờ trước ngày bắt đầu -> Phạt 100% cọc, hoàn 100% thuê")
    void cancel_Tier3_LateRefund_WhenUnder48HoursBeforeStart() {
        // Hợp đồng tạo cách đây 4 ngày (hết cooling-off), ngày bắt đầu vào ngày mai (< 48h)
        contract.setCreatedAt(OffsetDateTime.now().minusDays(4));
        contract.setStartDate(LocalDate.now().plusDays(1));
        CancelReservationRequest req = new CancelReservationRequest("Hủy sát nút trước 1 ngày");

        contractService.cancelPendingContract(100L, req, customerUser);

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(captor.capture());
        PaymentTransaction txn = captor.getValue();
        // Phạt 100% cọc (0đ cọc), hoàn 100% thuê (1.5tr)
        assertEquals(1_500_000L, txn.getAmount());
    }

    @Test
    @DisplayName("BR-CAN-08: Hủy trong 10 ngày ân hạn nhận kho -> Phạt 100% cọc, trừ tiền thuê số ngày đã giữ kho")
    void cancel_Tier4_InGracePeriod_HeldDaysDeducted() {
        // Hợp đồng tạo cách đây 10 ngày, ngày bắt đầu là 3 ngày trước (đã giữ kho 3 ngày)
        contract.setCreatedAt(OffsetDateTime.now().minusDays(10));
        contract.setStartDate(LocalDate.now().minusDays(3));
        CancelReservationRequest req = new CancelReservationRequest("Hủy sau khi quá hẹn 3 ngày");

        contractService.cancelPendingContract(100L, req, customerUser);

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository).save(captor.capture());
        PaymentTransaction txn = captor.getValue();
        // Phạt 100% cọc. Tiền thuê 1.5tr trừ 3 ngày giữ kho (3 * 50k = 150k) = 1.35tr
        assertEquals(1_350_000L, txn.getAmount());
    }

    @Test
    @DisplayName("Chặn khách hàng thao tác trên hợp đồng của người khác -> Ném lỗi ACCESS_DENIED")
    void cancel_throws_whenCustomerDoesNotOwnContract() {
        AppUser otherAppUser = new AppUser();
        otherAppUser.setId(999L);
        otherAppUser.setEmail("other@test.com");
        otherAppUser.setRole(UserRole.STORAGE_CUSTOMER);
        UserPrincipal otherUser = UserPrincipal.create(otherAppUser, List.of(1L));

        CancelReservationRequest req = new CancelReservationRequest("Thử hủy trộm");

        CustomException ex = assertThrows(CustomException.class, () ->
                contractService.cancelPendingContract(100L, req, otherUser));
        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chặn hủy hợp đồng khi trạng thái không phải PENDING_CHECK_IN -> Ném lỗi INVALID_STATUS_TRANSITION")
    void cancel_throws_whenContractNotPendingCheckIn() {
        contract.setStatus(ContractStatus.ACTIVE);
        CancelReservationRequest req = new CancelReservationRequest("Hợp đồng đã active");

        CustomException ex = assertThrows(CustomException.class, () ->
                contractService.cancelPendingContract(100L, req, customerUser));
        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
    }

    @Test
    @DisplayName("BR-CAN-02: hủy trước 5 ngày hoàn 2_800_000, không hoàn đủ 3_200_000")
    void cancelFiveDaysBeforeStartRefundsMidAmount() {
        contract.setCreatedAt(OffsetDateTime.now().minusDays(10));
        contract.setStartDate(LocalDate.now().plusDays(5));
        contract.setTotalRentalFee(2_400_000L);
        contract.setDepositAmount(800_000L);
        contract.setMonthlyPrice(800_000L);
        contract.setRentalMonths(3);

        contractService.cancelPendingContract(100L, new CancelReservationRequest("Hủy trước 5 ngày"), customerUser);

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository, atLeastOnce()).save(captor.capture());
        long total = captor.getAllValues().stream().mapToLong(PaymentTransaction::getAmount).sum();
        assertEquals(2_800_000L, total);
    }
}
