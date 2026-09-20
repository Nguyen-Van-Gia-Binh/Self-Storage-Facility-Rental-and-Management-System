package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.unit.dto.AvailabilityResponse;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
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

    @InjectMocks
    private AvailabilityServiceImpl availabilityService;

    @Test
    @DisplayName("Ném INVALID_START_DATE khi ngày bắt đầu ở quá khứ")
    void testPastStartDateThrowsException() {
        LocalDate pastDate = LocalDate.now().minusDays(1);
        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 1L, pastDate, 3)
        );
        assertEquals(ErrorCode.INVALID_START_DATE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném VALIDATION_FAILED khi số tháng thuê nhỏ hơn 1")
    void testInvalidRentalMonthsThrowsException() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 1L, startDate, 0)
        );
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném FACILITY_NOT_FOUND khi facility không tồn tại hoặc INACTIVE")
    void testFacilityNotFound() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        when(facilityRepository.findById(1L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () ->
                availabilityService.checkAvailability(1L, 1L, startDate, 3)
        );
        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tính toán chính xác availableSlots, endDateExclusive, phí thuê và tiền cọc")
    void testCheckAvailabilitySuccess() {
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        int rentalMonths = 3;

        Facility facility = new Facility();
        facility.setCode("FAC-Q1");
        facility.setName("Kho Q1");
        facility.setStatus(FacilityStatus.ACTIVE);
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));

        UnitType unitType = UnitType.builder()
                .code("UT-S")
                .name("Loại S")
                .isActive(true)
                .build();
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));

        FacilityUnitTypePrice price = FacilityUnitTypePrice.builder()
                .facilityId(1L)
                .unitTypeId(7L)
                .monthlyPrice(800000L)
                .build();
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(price));

        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(7L), anyCollection())).thenReturn(10L);
        when(storageUnitRepository.countOverlappingReservations(eq(1L), eq(7L), any(), any())).thenReturn(2L);
        when(storageUnitRepository.countOverlappingContracts(eq(1L), eq(7L), any(), any())).thenReturn(5L);

        AvailabilityResponse response = availabilityService.checkAvailability(1L, 7L, startDate, rentalMonths);

        assertEquals(1L, response.getFacilityId());
        assertEquals(7L, response.getUnitTypeId());
        assertEquals(startDate, response.getStartDate());
        assertEquals(LocalDate.of(2027, 1, 1), response.getEndDateExclusive());
        assertEquals(3, response.getRentalMonths());
        assertEquals(3L, response.getAvailableSlots()); // 10 - 2 - 5 = 3
        assertEquals(800000L, response.getMonthlyPrice());
        assertEquals(2400000L, response.getTotalRentalFee());
        assertEquals(800000L, response.getDepositAmount());
    }
}
