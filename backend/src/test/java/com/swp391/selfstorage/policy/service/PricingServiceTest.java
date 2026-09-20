package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;
import com.swp391.selfstorage.policy.service.impl.PricingServiceImpl;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
    @DisplayName("Cập nhật đơn giá tháng thành công khi thỏa mãn bội số 1.000đ (BR-GEN-04)")
    void testUpdatePriceSuccess() {
        Long facilityId = 1L;
        Long unitTypeId = 2L;
        UpdatePriceRequest request = new UpdatePriceRequest(1500000L);

        UnitType mockUnitType = UnitType.builder().code("UT-S").name("Kho Nhỏ").build();
        FacilityUnitTypePrice existingPrice = FacilityUnitTypePrice.builder()
                .id(10L)
                .facilityId(facilityId)
                .unitTypeId(unitTypeId)
                .monthlyPrice(1200000L)
                .build();

        when(facilityRepository.existsById(facilityId)).thenReturn(true);
        when(unitTypeRepository.findById(unitTypeId)).thenReturn(Optional.of(mockUnitType));
        when(priceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId))
                .thenReturn(Optional.of(existingPrice));
        when(priceRepository.save(any(FacilityUnitTypePrice.class))).thenAnswer(i -> i.getArgument(0));

        FacilityPriceResponse response = pricingService.updatePrice(facilityId, unitTypeId, request);

        assertNotNull(response);
        assertEquals(1500000L, response.getMonthlyPrice());
        assertEquals("UT-S", response.getUnitTypeCode());
        verify(priceRepository, times(1)).save(existingPrice);
    }

    @Test
    @DisplayName("Ném lỗi VALIDATION_FAILED khi đơn giá không chia hết cho 1.000đ")
    void testUpdatePriceNotMultipleOf1000ThrowsException() {
        UpdatePriceRequest request = new UpdatePriceRequest(1500500L);

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
        when(facilityRepository.existsById(999L)).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class, () -> {
            pricingService.updatePrice(999L, 2L, request);
        });

        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }
}
