package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.unit.dto.AvailabilityResponse;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private FacilityRepository facilityRepository;

    @Mock
    private UnitTypeRepository unitTypeRepository;

    @Mock
    private FacilityUnitTypePriceRepository priceRepository;

    @Mock
    private StorageUnitRepository storageUnitRepository;

    @Mock
    private PolicyVersionRepository policyVersionRepository;

    @InjectMocks
    private AvailabilityServiceImpl availabilityService;

    private Facility activeFacility;
    private UnitType activeUnitType;
    private FacilityUnitTypePrice unitPrice;

    @BeforeEach
    void setUp() {
        activeFacility = new Facility();
        activeFacility.setId(1L);
        activeFacility.setCode("FAC-Q1");
        activeFacility.setName("Kho Quận 1");
        activeFacility.setStatus(FacilityStatus.ACTIVE);

        activeUnitType = UnitType.builder()
                .id(7L)
                .code("UT-S")
                .name("Loại S — 3m²")
                .isActive(true)
                .build();

        unitPrice = FacilityUnitTypePrice.builder()
                .id(10L)
                .facilityId(1L)
                .unitTypeId(7L)
                .monthlyPrice(800000L)
                .build();

        PolicyVersion policy = PolicyVersion.builder()
                .id(1L)
                .rentalBufferDays(15)
                .rentalDailyDivisor(30)
                .reservationHoldHours(48)
                .build();
        lenient().when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
                .thenReturn(Optional.of(policy));
    }

    @Test
    @DisplayName("US-SC-01.3, BR-RES-01: Ném lỗi INVALID_START_DATE khi ngày bắt đầu ở quá khứ")
    void shouldThrowCustomException_whenStartDateIsInPast() {
        LocalDate pastDate = LocalDate.now().minusDays(1);
        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 7L, pastDate, 3)
        );
        assertEquals(ErrorCode.INVALID_START_DATE, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-01.3, BR-RES-01: Ném lỗi INVALID_START_DATE khi ngày bắt đầu là null")
    void shouldThrowCustomException_whenStartDateIsNull() {
        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 7L, null, 3)
        );
        assertEquals(ErrorCode.INVALID_START_DATE, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-01.3, BR-RES-01: Ném lỗi VALIDATION_FAILED khi số tháng thuê nhỏ hơn 1")
    void shouldThrowCustomException_whenRentalMonthsLessThanOne() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 7L, startDate, 0)
        );
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-01.3, BR-RES-01: Ném lỗi VALIDATION_FAILED khi số tháng thuê là null")
    void shouldThrowCustomException_whenRentalMonthsIsNull() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 7L, startDate, null)
        );
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-01.3, BR-RES-01: Ném lỗi FACILITY_NOT_FOUND khi cơ sở không tồn tại hoặc đã INACTIVE")
    void shouldThrowCustomException_whenFacilityNotFoundOrInactive() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        when(facilityRepository.findById(1L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 7L, startDate, 3)
        );
        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-01.3, BR-RES-01: Ném lỗi UNIT_TYPE_NOT_FOUND khi loại ô kho không tồn tại hoặc INACTIVE")
    void shouldThrowCustomException_whenUnitTypeNotFoundOrInactive() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 7L, startDate, 3)
        );
        assertEquals(ErrorCode.UNIT_TYPE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-01.3: Ném lỗi UNIT_TYPE_NOT_FOUND khi loại ô kho chưa cấu hình giá tại cơ sở")
    void shouldThrowCustomException_whenPriceNotConfiguredForFacility() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 7L, startDate, 3)
        );
        assertEquals(ErrorCode.UNIT_TYPE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-01.3, BR-AVL-01..02, BR-PRI-01, BR-DEP-01: Tính toán chính xác availableSlots, ngày kết thúc, phí thuê và tiền cọc")
    void shouldCalculateAvailabilityAndPricingCorrectly_whenValidRequest() {
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        int rentalMonths = 3;

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(unitPrice));

        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(7L), anyCollection())).thenReturn(10L);
        when(storageUnitRepository.countBusyUnits(eq(1L), eq(7L), any(), any(), eq(15))).thenReturn(7L);

        AvailabilityResponse response = availabilityService.checkAvailability(1L, 7L, startDate, rentalMonths);

        assertNotNull(response);
        assertEquals(1L, response.getFacilityId());
        assertEquals(7L, response.getUnitTypeId());
        assertEquals(startDate, response.getStartDate());
        assertEquals(LocalDate.of(2027, 1, 1), response.getEndDateExclusive());
        assertEquals(3, response.getRentalMonths());
        assertEquals(3L, response.getAvailableSlots()); // 10 - 7 ô bận (mỗi ô một lần)
        assertEquals(800000L, response.getMonthlyPrice());
        assertEquals(2400000L, response.getTotalRentalFee()); // 800000 * 3 (BR-PRI-01)
        assertEquals(800000L, response.getDepositAmount());   // multiplier null -> 1 tháng cọc (BR-DEP-01)
    }

    @Test
    @DisplayName("BR-DEP-01: Tiền cọc bằng đơn giá nhân depositMultiplier của chính sách hiệu lực")
    void shouldApplyDepositMultiplierFromActivePolicy() {
        LocalDate startDate = LocalDate.now().plusDays(2);
        PolicyVersion pricedPolicy = PolicyVersion.builder()
                .id(2L)
                .rentalBufferDays(15)
                .depositMultiplier(new BigDecimal("1.50"))
                .build();
        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(any()))
                .thenReturn(Optional.of(pricedPolicy));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(unitPrice));
        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(7L), anyCollection())).thenReturn(4L);
        when(storageUnitRepository.countBusyUnits(eq(1L), eq(7L), any(), any(), eq(15))).thenReturn(1L);

        AvailabilityResponse response = availabilityService.checkAvailability(1L, 7L, startDate, 1);

        assertEquals(800000L, response.getMonthlyPrice());
        assertEquals(1200000L, response.getDepositAmount());
    }

    @Test
    @DisplayName("US-SC-01.3, BR-AVL-01: Đảm bảo availableSlots không bị âm khi nhu cầu trùng lặp vượt quá số kho khả dụng (clamp về 0)")
    void shouldClampAvailableSlotsToZero_whenDemandsExceedExploitableUnits() {
        LocalDate startDate = LocalDate.of(2026, 11, 1);
        int rentalMonths = 1;

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(activeFacility));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(activeUnitType));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(unitPrice));

        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(7L), anyCollection())).thenReturn(5L);
        when(storageUnitRepository.countBusyUnits(eq(1L), eq(7L), any(), any(), eq(15))).thenReturn(7L);

        AvailabilityResponse response = availabilityService.checkAvailability(1L, 7L, startDate, rentalMonths);

        assertNotNull(response);
        assertEquals(0L, response.getAvailableSlots());
    }
}
