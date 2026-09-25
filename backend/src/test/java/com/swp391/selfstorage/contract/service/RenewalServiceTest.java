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
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
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
import com.swp391.selfstorage.policy.dto.PolicyResponse;
import com.swp391.selfstorage.policy.service.PolicyService;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;

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
                renewalMapper);
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
                .depositMultiplier(BigDecimal.valueOf(1.0))
                .build();
    }

    @Test
    @DisplayName("Báo giá gia hạn thành công cho hợp đồng ACTIVE")
    void testGetRenewalQuote_success() {
        RentalContract contract = buildContract(ContractStatus.ACTIVE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any())).thenReturn(false);

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
    @DisplayName("Báo giá gia hạn cho hợp đồng OVERDUE phải cộng thêm phí quá hạn")
    void testGetRenewalQuote_overdue_includesOverdueFee() {
        RentalContract contract = buildContract(ContractStatus.OVERDUE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any())).thenReturn(false);

        FacilityUnitTypePrice price = FacilityUnitTypePrice.builder().monthlyPrice(800000L).build();
        when(facilityPriceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(price));

        RenewalQuoteResponse quote = renewalService.getRenewalQuote(100L, new RenewalRequest(2));

        assertNotNull(quote);
        assertEquals(160000L, quote.getOverdueFeeSettled()); // Phí phạt quá hạn
        assertEquals(1600000L, quote.getRentalFeeAmount()); // 800,000 * 2
        assertEquals(1760000L, quote.getTotalAmount()); // 1,600,000 + 160,000
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
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any())).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class,
                () -> renewalService.getRenewalQuote(100L, new RenewalRequest(3)));

        assertEquals(ErrorCode.CAPACITY_NOT_AVAILABLE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Gia hạn thành công, cập nhật ngày kết thúc mới và chuyển OVERDUE về ACTIVE")
    void testProcessRenewal_success() {
        RentalContract contract = buildContract(ContractStatus.OVERDUE);
        when(rentalContractRepository.findById(100L)).thenReturn(Optional.of(contract));
        when(policyService.getActivePolicy()).thenReturn(buildActivePolicy());
        when(reservationRepository.existsOverlappingReservationForUnit(eq(42L), any(), any(), any())).thenReturn(false);

        FacilityUnitTypePrice price = FacilityUnitTypePrice.builder().monthlyPrice(800000L).build();
        when(facilityPriceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(price));

        when(contractRenewalRepository.save(any(ContractRenewal.class))).thenAnswer(inv -> {
            ContractRenewal cr = inv.getArgument(0);
            cr.setId(1L);
            return cr;
        });

        RenewalResponse response = renewalService.processRenewal(100L, new RenewalRequest(3), 555L);

        assertNotNull(response);
        assertEquals(LocalDate.of(2027, 4, 1), response.getNewEndDate());
        assertEquals(ContractStatus.ACTIVE, contract.getStatus()); // Đã khôi phục ACTIVE
        assertEquals(0L, contract.getOverdueFeeAccrued()); // Đã xóa nợ phạt
        assertEquals(LocalDate.of(2027, 4, 1), contract.getEndDateExclusive());
        verify(rentalContractRepository).save(contract);
    }
}
