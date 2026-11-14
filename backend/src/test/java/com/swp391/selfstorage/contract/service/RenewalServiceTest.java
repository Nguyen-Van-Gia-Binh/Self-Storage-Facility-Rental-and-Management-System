package com.swp391.selfstorage.contract.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.ForceRenewalRequest;
import com.swp391.selfstorage.contract.dto.RenewalQuoteResponse;
import com.swp391.selfstorage.contract.dto.RenewalRequest;
import com.swp391.selfstorage.contract.dto.RenewalResponse;
import com.swp391.selfstorage.contract.entity.ContractRenewal;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.mapper.RenewalMapper;
import com.swp391.selfstorage.contract.repository.ContractRenewalRepository;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.service.impl.RenewalServiceImpl;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.policy.dto.PolicyResponse;
import com.swp391.selfstorage.policy.service.PolicyService;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;

@ExtendWith(MockitoExtension.class)
class RenewalServiceTest {

    @Mock
    private RentalContractRepository rentalContractRepository;

    @Mock
    private ContractRenewalRepository contractRenewalRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private FacilityUnitTypePriceRepository facilityPriceRepository;

    @Mock
    private PolicyService policyService;

    @Mock
    private UnitTypeRepository unitTypeRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    private final RenewalMapper renewalMapper = new RenewalMapper();

    private RenewalService renewalService;

    @BeforeEach
    void setUp() {
        renewalService = new RenewalServiceImpl(
                rentalContractRepository,
                contractRenewalRepository,
                reservationRepository,
                facilityPriceRepository,
                policyService,
                renewalMapper,
                unitTypeRepository,
                paymentTransactionRepository);
        org.mockito.Mockito.lenient().when(unitTypeRepository.findById(7L))
                .thenReturn(Optional.of(UnitType.builder().id(7L).code("UT-S").isActive(true).build()));
    }

    private RentalContract buildContract(ContractStatus status) {
        return RentalContract.builder()
                .id(100L)
                .code("CTR-202610-001")
                .customerId(15L)
                .facilityId(1L)
                .storageUnitId(42L)
                .unitTypeId(7L)
                .startDate(LocalDate.of(2026, 10, 1))
                .endDateExclusive(LocalDate.of(2027, 1, 1))
                .rentalMonths(3)
                .monthlyPrice(800000L)
                .status(status)
                .overdueFeeAccrued(status == ContractStatus.OVERDUE ? 160000L : 0L)
                .build();
    }

    private PolicyResponse buildActivePolicy() {
        return PolicyResponse.builder()
                .id(1L)
                .versionNo(1)
                .renewalMinMonths(1)
                .renewalMaxMonths(12)
                .rentalBufferDays(15)
                .depositMultiplier(BigDecimal.valueOf(1.0))
                .build();
    }

    @Test
    @DisplayName("Báo giá gia hạn thành công cho hợp đồng ACTIVE")
    void testGetRenewalQuote_success() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), anyInt())).thenReturn(false);

        FacilityUnitTypePrice price = FacilityUnitTypePrice.builder().monthlyPrice(850000L).build();
        when(facilityPriceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(price));

        RenewalQuoteResponse quote = renewalService.getRenewalQuote(100L, new RenewalRequest(3));

        assertNotNull(quote);
        assertEquals(100L, quote.getContractId());
        assertEquals(3, quote.getRenewalMonths());
        assertEquals(LocalDate.of(2027, 4, 1), quote.getNewEndDate());
        assertEquals(850000L, quote.getMonthlyPriceSnapshot());
        assertEquals(2550000L, quote.getRentalFeeAmount()); // 850,000 * 3
        assertEquals(0L, quote.getOverdueFeeSettled());
        assertEquals(2550000L, quote.getTotalAmount());
    }

    @Test
    @DisplayName("Cho phép lấy báo giá gia hạn khi hợp đồng còn trong khung T-30 đến T-20 (BR-REN-01)")
    void testGetRenewalQuote_lessThan30Days_success() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        contract.setEndDateExclusive(LocalDate.now().plusDays(25)); // Còn 25 ngày (nằm trong khung T-30 đến T-20)
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), anyInt())).thenReturn(false);
        when(facilityPriceRepository.findByFacilityIdAndUnitTypeId(1L, 7L))
                .thenReturn(Optional.of(FacilityUnitTypePrice.builder().monthlyPrice(800000L).build()));

        RenewalQuoteResponse quote = renewalService.getRenewalQuote(100L, new RenewalRequest(1));

        assertNotNull(quote);
        assertEquals(100L, quote.getContractId());
        assertEquals(1, quote.getRenewalMonths());
        assertEquals(800000L, quote.getTotalAmount());
    }

    @Test
    @DisplayName("Ném RENEWAL_DEADLINE_PASSED khi hợp đồng còn dưới 20 ngày tự gia hạn (BR-REN-01)")
    void testGetRenewalQuote_lessThan20Days_throwsRenewalDeadlinePassed() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        contract.setEndDateExclusive(LocalDate.now().plusDays(10)); // Còn 10 ngày (< 20 ngày)
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(1)));

        assertEquals(ErrorCode.RENEWAL_DEADLINE_PASSED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném RENEWAL_NOT_ALLOWED khi hợp đồng OVERDUE còn nợ phạt chưa thanh toán (BR-REN-06)")
    void testGetRenewalQuote_overdueWithUnpaidDebt_throwsRenewalNotAllowed() {
        RentalContract contract = buildContract(ContractStatus.OVERDUE);
        contract.setOverdueFeeAccrued(160000L);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(2)));

        assertEquals(ErrorCode.RENEWAL_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném RENEWAL_NOT_ALLOWED khi hợp đồng đã chuyển sang OVERDUE kể cả khi overdueFeeAccrued == 0 (BR-REN-02, BR-REN-06)")
    void testGetRenewalQuote_overdueClearedDebt_stillThrowsRenewalNotAllowed() {
        RentalContract contract = buildContract(ContractStatus.OVERDUE);
        contract.setOverdueFeeAccrued(0L);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(3)));

        assertEquals(ErrorCode.RENEWAL_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném RENEWAL_NOT_ALLOWED khi gọi processRenewal trên hợp đồng OVERDUE (BR-REN-06)")
    void testProcessRenewal_overdueClearedDebt_throwsRenewalNotAllowed() {
        RentalContract contract = buildContract(ContractStatus.OVERDUE);
        contract.setOverdueFeeAccrued(0L);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(paymentTransactionRepository.findById(777L)).thenReturn(Optional.of(PaymentTransaction.builder()
                .id(777L).amount(2_400_000L).renewalMonths(3).build()));

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.processRenewal(100L, new RenewalRequest(3), 777L));

        assertEquals(ErrorCode.RENEWAL_NOT_ALLOWED, ex.getErrorCode());
        verify(rentalContractRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném CONTRACT_NOT_FOUND khi hợp đồng không tồn tại")
    void testGetRenewalQuote_contractNotFound() {
        when(rentalContractRepository.findById(999L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(999L, new RenewalRequest(3)));

        assertEquals(ErrorCode.CONTRACT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném RENEWAL_NOT_ALLOWED khi hợp đồng ở trạng thái CLOSED")
    void testGetRenewalQuote_contractStatusClosed_throwsConflict() {
        RentalContract contract = buildContract(ContractStatus.CLOSED);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(3)));

        assertEquals(ErrorCode.RENEWAL_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném RENEWAL_MONTHS_INVALID khi số tháng gia hạn vượt quá giới hạn chính sách")
    void testGetRenewalQuote_invalidMonths_throwsException() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy()); // max = 12

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(15)));

        assertEquals(ErrorCode.RENEWAL_MONTHS_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném CAPACITY_NOT_AVAILABLE khi ô kho đã có đơn đặt chỗ trong tương lai")
    void testGetRenewalQuote_capacityConflict_throwsException() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), anyInt())).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(3)));

        assertEquals(ErrorCode.CAPACITY_NOT_AVAILABLE, ex.getErrorCode());
        assertEquals("Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo. Quý khách vui lòng chọn thuê ô kho mới hoặc lên lịch trả kho.", ex.getMessage());
    }

    @Test
    @DisplayName("BR-AVL-02: Từ chối gia hạn khi hợp đồng khác trên cùng ô giao khoảng đệm")
    void testGetRenewalQuote_otherContractWithinBuffer_throwsException() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), eq(15))).thenReturn(false);
        when(rentalContractRepository.existsOverlappingContractForUnit(eq(42L), any(), any(), eq(15), eq(100L))).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(3)));

        assertEquals(ErrorCode.CAPACITY_NOT_AVAILABLE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Gia hạn thành công, cập nhật ngày kết thúc mới cho hợp đồng ACTIVE")
    void testProcessRenewal_success() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(paymentTransactionRepository.findById(555L)).thenReturn(Optional.of(PaymentTransaction.builder()
                .id(555L).amount(2_400_000L).renewalMonths(3).build()));

        when(contractRenewalRepository.save(any(ContractRenewal.class))).thenAnswer(inv -> {
            ContractRenewal cr = inv.getArgument(0);
            cr.setId(1L);
            return cr;
        });

        RenewalResponse response = renewalService.processRenewal(100L, new RenewalRequest(3), 555L);

        assertNotNull(response);
        assertEquals(LocalDate.of(2027, 4, 1), response.getNewEndDate());
        assertEquals(ContractStatus.ACTIVE, contract.getStatus());
        assertEquals(0L, contract.getOverdueFeeAccrued());
        assertEquals(LocalDate.of(2027, 4, 1), contract.getEndDateExclusive());
        verify(rentalContractRepository).save(contract);

        ArgumentCaptor<ContractRenewal> saved = ArgumentCaptor.forClass(ContractRenewal.class);
        verify(contractRenewalRepository).save(saved.capture());
        assertEquals(555L, saved.getValue().getPaymentTransactionId());
        assertEquals(LocalDate.of(2027, 4, 1), saved.getValue().getNewEndDate());
        assertEquals(2_400_000L, saved.getValue().getTotalPaid());
        assertEquals(800_000L, saved.getValue().getMonthlyPriceSnapshot());
    }

    @ParameterizedTest(name = "Gia hạn {0} tháng thì hạn mới = hạn cũ cộng đúng {0} tháng")
    @ValueSource(ints = {1, 3, 6, 12})
    void testProcessRenewal_extendsExactMonths(int months) {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(paymentTransactionRepository.findById(800L + months)).thenReturn(Optional.of(PaymentTransaction.builder()
                .amount(800_000L * months).renewalMonths(months).build()));
        when(contractRenewalRepository.save(any(ContractRenewal.class))).thenAnswer(inv -> {
            ContractRenewal cr = inv.getArgument(0);
            cr.setId(1L);
            return cr;
        });

        RenewalResponse response = renewalService.processRenewal(100L, new RenewalRequest(months), 800L + months);

        LocalDate expected = LocalDate.of(2027, 1, 1).plusMonths(months);
        assertEquals(expected, response.getNewEndDate());
        assertEquals(expected, contract.getEndDateExclusive());
        assertEquals(3 + months, contract.getRentalMonths());
    }

    @Test
    @DisplayName("Giao dịch đã gia hạn thì không cộng thêm ngày")
    void testProcessRenewal_samePayment_doesNotExtendAgain() {
        ContractRenewal existing = ContractRenewal.builder()
                .id(9L)
                .contractId(100L)
                .paymentTransactionId(555L)
                .previousEndDate(LocalDate.of(2027, 1, 1))
                .newEndDate(LocalDate.of(2027, 4, 1))
                .rentalMonths(3)
                .monthlyPriceSnapshot(800000L)
                .policyVersionId(1L)
                .overdueFeeSettled(0L)
                .rentalFeeAmount(2400000L)
                .totalPaid(2400000L)
                .build();
        when(contractRenewalRepository.findByPaymentTransactionId(555L)).thenReturn(Optional.of(existing));

        RenewalResponse response = renewalService.processRenewal(100L, new RenewalRequest(3), 555L);

        assertEquals(LocalDate.of(2027, 4, 1), response.getNewEndDate());
        assertEquals(3, response.getRenewalMonths());
        verify(rentalContractRepository, never()).save(any());
        verify(contractRenewalRepository, never()).save(any());
    }

    @Test
    @DisplayName("CAT-04 / BR-BOM-04: Chặn gia hạn khi UnitType đã bị chuyển sang INACTIVE")
    void testGetRenewalQuote_inactiveUnitType_throwsUnitTypeInactive() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(unitTypeRepository.findById(7L))
                .thenReturn(Optional.of(UnitType.builder().id(7L).code("UT-S").isActive(false).build()));

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(3)));

        assertEquals(ErrorCode.UNIT_TYPE_INACTIVE, ex.getErrorCode());
    }

    @Test
    @DisplayName("FM Force Renewal: Lấy báo giá thành công khi còn dưới 20 ngày, cộng phụ phí 200.000đ (BR-REN-10)")
    void testGetForceRenewalQuote_success() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        contract.setEndDateExclusive(LocalDate.now().plusDays(10)); // Còn 10 ngày (< 20 ngày)
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), anyInt())).thenReturn(false);

        FacilityUnitTypePrice price = FacilityUnitTypePrice.builder().monthlyPrice(850000L).build();
        when(facilityPriceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(price));

        ForceRenewalRequest req = ForceRenewalRequest.builder().renewalMonths(3).build();
        RenewalQuoteResponse quote = renewalService.getForceRenewalQuote(100L, req);

        assertNotNull(quote);
        assertEquals(100L, quote.getContractId());
        assertEquals(3, quote.getRenewalMonths());
        assertEquals(Boolean.TRUE, quote.getIsForceRenewal());
        assertEquals(200_000L, quote.getLateAdminFee());
        assertEquals(2_550_000L, quote.getRentalFeeAmount()); // 850k * 3
        assertEquals(2_750_000L, quote.getTotalAmount()); // 2.550.000 + 200.000
    }

    @Test
    @DisplayName("FM Force Renewal: Chặn lấy báo giá khi ô kho đã có khách khác đặt trước (BR-REN-10, BR-AVL-02)")
    void testGetForceRenewalQuote_capacityConflict_throwsCapacityNotAvailable() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        contract.setEndDateExclusive(LocalDate.now().plusDays(10));
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), anyInt())).thenReturn(true);

        ForceRenewalRequest req = ForceRenewalRequest.builder().renewalMonths(3).build();
        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getForceRenewalQuote(100L, req));

        assertEquals(ErrorCode.CAPACITY_NOT_AVAILABLE, ex.getErrorCode());
    }

    @Test
    @DisplayName("FM Force Renewal: Kích hoạt gia hạn thành công tại quầy kèm phụ phí 200k và lưu hình thức thanh toán (BR-REN-10)")
    void testProcessForceRenewal_success() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        LocalDate oldEndDate = LocalDate.now().plusDays(10); // Còn 10 ngày (< 20 ngày)
        contract.setEndDateExclusive(oldEndDate);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any(), anyInt())).thenReturn(false);

        FacilityUnitTypePrice price = FacilityUnitTypePrice.builder().monthlyPrice(800000L).build();
        when(facilityPriceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(price));

        when(contractRenewalRepository.save(any(ContractRenewal.class))).thenAnswer(inv -> {
            ContractRenewal cr = inv.getArgument(0);
            cr.setId(101L);
            return cr;
        });

        ForceRenewalRequest req = ForceRenewalRequest.builder()
                .renewalMonths(3)
                .paymentMethod("CASH")
                .notes("Khách nộp tiền mặt tại cơ sở")
                .build();

        RenewalResponse res = renewalService.processForceRenewal(100L, req);

        LocalDate expectedNewEndDate = oldEndDate.plusMonths(3);
        assertNotNull(res);
        assertEquals(expectedNewEndDate, res.getNewEndDate());
        assertEquals(Boolean.TRUE, res.getIsForceRenewal());
        assertEquals(200_000L, res.getLateAdminFee());
        assertEquals("CASH", res.getPaymentMethod());
        assertEquals(2_600_000L, res.getTotalPaid()); // 800k * 3 + 200k

        ArgumentCaptor<ContractRenewal> captor = ArgumentCaptor.forClass(ContractRenewal.class);
        verify(contractRenewalRepository).save(captor.capture());
        ContractRenewal saved = captor.getValue();
        assertEquals(Boolean.TRUE, saved.getIsForceRenewal());
        assertEquals(200_000L, saved.getLateAdminFee());
        assertEquals("CASH", saved.getPaymentMethod());
        assertEquals("Khách nộp tiền mặt tại cơ sở", saved.getNotes());
        assertEquals(2_600_000L, saved.getTotalPaid());

        verify(rentalContractRepository).save(contract);
        assertEquals(expectedNewEndDate, contract.getEndDateExclusive());
    }

    @Test
    @DisplayName("FM Force Renewal: Chặn gia hạn khi hợp đồng đã chuyển sang OVERDUE (BR-REN-06, BR-OVD-01)")
    void testProcessForceRenewal_overdue_throwsRenewalNotAllowed() {
        RentalContract contract = buildContract(ContractStatus.OVERDUE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));

        ForceRenewalRequest req = ForceRenewalRequest.builder()
                .renewalMonths(3)
                .paymentMethod("BANK_TRANSFER")
                .build();

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.processForceRenewal(100L, req));

        assertEquals(ErrorCode.RENEWAL_NOT_ALLOWED, ex.getErrorCode());
        verify(contractRenewalRepository, never()).save(any());
        verify(rentalContractRepository, never()).save(any());
    }
}
