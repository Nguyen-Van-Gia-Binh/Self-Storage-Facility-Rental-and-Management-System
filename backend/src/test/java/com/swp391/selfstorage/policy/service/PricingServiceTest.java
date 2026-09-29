package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;
import com.swp391.selfstorage.policy.service.impl.PricingServiceImpl;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePriceVersion;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceVersionRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock
    private FacilityUnitTypePriceRepository priceRepository;

    @Mock
    private FacilityRepository facilityRepository;

    @Mock
    private UnitTypeRepository unitTypeRepository;

    private PricingService pricingService;

    @BeforeEach
    void setUp() {
        pricingService = new PricingServiceImpl(priceRepository, facilityRepository, unitTypeRepository);
    }

    @Test
    @DisplayName("Cập nhật đơn giá m² thành công: giá thuê tháng = đơn giá × diện tích, làm tròn 1.000 (BR-GEN-05)")
    void testUpdatePriceSuccess() {
        Long facilityId = 1L;
        Long unitTypeId = 2L;
        // 750_000 × 2.5 m² = 1_875_000 → làm tròn 1.000 vẫn 1_875_000
        UpdatePriceRequest request = UpdatePriceRequest.builder()
                .pricePerM2(750000L)
                .build();

        Facility facility = new Facility();
        facility.setStatus(FacilityStatus.ACTIVE);

        UnitType mockUnitType = UnitType.builder()
                .code("UT-S")
                .name("Kho Nhỏ")
                .widthM(new BigDecimal("1.00"))
                .lengthM(new BigDecimal("2.50"))
                .heightM(new BigDecimal("2.00"))
                .build();
        FacilityUnitTypePrice existingPrice = FacilityUnitTypePrice.builder()
                .id(10L)
                .facilityId(facilityId)
                .unitTypeId(unitTypeId)
                .monthlyPrice(1200000L)
                .build();

        when(facilityRepository.findById(facilityId)).thenReturn(Optional.of(facility));
        when(unitTypeRepository.findById(unitTypeId)).thenReturn(Optional.of(mockUnitType));
        when(priceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId))
                .thenReturn(Optional.of(existingPrice));
        when(priceRepository.save(any(FacilityUnitTypePrice.class))).thenAnswer(i -> i.getArgument(0));

        FacilityPriceResponse response = pricingService.updatePrice(facilityId, unitTypeId, request);

        assertNotNull(response);
        assertEquals(1875000L, response.getMonthlyPrice());
        assertEquals(750000L, response.getPricePerM2());
        assertEquals("UT-S", response.getUnitTypeCode());
        verify(priceRepository, times(1)).save(existingPrice);
        assertEquals(1875000L, existingPrice.getMonthlyPrice());
        assertEquals(750000L, existingPrice.getPricePerM2());
    }

    @Test
    @DisplayName("Ném lỗi VALIDATION_FAILED khi đơn giá m² không chia hết cho 1.000đ")
    void testUpdatePriceNotMultipleOf1000ThrowsException() {
        Facility facility = new Facility();
        facility.setStatus(FacilityStatus.ACTIVE);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(unitTypeRepository.findById(2L)).thenReturn(Optional.of(UnitType.builder()
                .widthM(new BigDecimal("1.00"))
                .lengthM(new BigDecimal("1.00"))
                .heightM(new BigDecimal("2.00"))
                .build()));

        UpdatePriceRequest request = UpdatePriceRequest.builder().pricePerM2(1500500L).build();

        CustomException ex = assertThrows(CustomException.class, () -> {
            pricingService.updatePrice(1L, 2L, request);
        });

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        verify(priceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném lỗi FACILITY_NOT_FOUND khi cơ sở không tồn tại")
    void testUpdatePriceFacilityNotFoundThrowsException() {
        UpdatePriceRequest request = new UpdatePriceRequest(1500000L);
        when(facilityRepository.findById(999L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> {
            pricingService.updatePrice(999L, 2L, request);
        });

        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Giá hẹn tương lai không ghi đè giá đang áp dụng, nhưng vẫn lưu phiên bản")
    void testFutureEffectiveDateKeepsLivePrice() {
        FacilityUnitTypePriceVersionRepository versionRepository = mock(FacilityUnitTypePriceVersionRepository.class);
        PricingService service = new PricingServiceImpl(
                priceRepository, versionRepository, facilityRepository, unitTypeRepository, null);

        Long facilityId = 1L;
        Long unitTypeId = 2L;
        Facility facility = new Facility();
        facility.setStatus(FacilityStatus.ACTIVE);
        UnitType unitType = UnitType.builder()
                .code("UT-M")
                .name("Kho vừa")
                .widthM(new BigDecimal("2.00"))
                .lengthM(new BigDecimal("2.00"))
                .heightM(new BigDecimal("2.00"))
                .build();
        FacilityUnitTypePrice live = FacilityUnitTypePrice.builder()
                .id(10L)
                .facilityId(facilityId)
                .unitTypeId(unitTypeId)
                .monthlyPrice(1200000L)
                .pricePerM2(300000L)
                .build();
        LocalDate future = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(7);
        UpdatePriceRequest request = UpdatePriceRequest.builder()
                .pricePerM2(400000L)
                .effectiveDate(future)
                .build();

        when(facilityRepository.findById(facilityId)).thenReturn(Optional.of(facility));
        when(unitTypeRepository.findById(unitTypeId)).thenReturn(Optional.of(unitType));
        when(priceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId))
                .thenReturn(Optional.of(live));
        when(versionRepository.save(any(FacilityUnitTypePriceVersion.class))).thenAnswer(i -> i.getArgument(0));

        FacilityPriceResponse response = service.updatePrice(facilityId, unitTypeId, request);

        assertEquals(1200000L, response.getMonthlyPrice());
        assertEquals(1200000L, live.getMonthlyPrice());
        verify(priceRepository, never()).save(any());
        verify(versionRepository, times(1)).save(any(FacilityUnitTypePriceVersion.class));
    }

    @Test
    @DisplayName("Cơ sở ngừng khai thác không được cập nhật giá")
    void testInactiveFacilityRejected() {
        Facility facility = new Facility();
        facility.setStatus(FacilityStatus.INACTIVE);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));

        CustomException ex = assertThrows(CustomException.class, () -> pricingService.updatePrice(
                1L, 2L, UpdatePriceRequest.builder().pricePerM2(500000L).build()));

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        verify(priceRepository, never()).save(any());
    }
}
