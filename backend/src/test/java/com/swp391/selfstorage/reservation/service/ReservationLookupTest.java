package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationLookupTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @Mock private FacilityRepository facilityRepository;
    @Mock private UnitTypeRepository unitTypeRepository;
    @Mock private FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;
    @Mock private RentalContractRepository rentalContractRepository;
    @InjectMocks private ReservationServiceImpl service;

    private Reservation rsv;

    @BeforeEach
    void setUp() {
        rsv = new Reservation();
        rsv.setId(101L);
        rsv.setCode("RSV-20261001-1234");
        rsv.setFacilityId(1L);
        rsv.setCustomerId(5L);
        rsv.setUnitTypeId(2L);
        rsv.setStorageUnitId(10L);
        rsv.setStartDate(LocalDate.of(2026, 10, 1));
        rsv.setRentalMonths(3);
        rsv.setEndDateExclusive(LocalDate.of(2027, 1, 1));
        rsv.setMonthlyPriceSnapshot(1_000_000L);
        rsv.setDiscountAmount(0L);
        rsv.setDepositAmount(1_000_000L);
        rsv.setTotalRentalFee(3_000_000L);
        rsv.setTotalPayable(4_000_000L);
        rsv.setStatus(ReservationStatus.CONFIRMED);
        rsv.setHoldExpiresAt(OffsetDateTime.now().plusHours(24));
    }

    @Test
    @DisplayName("T3.5: lookup theo ma RSV-... thanh cong")
    void shouldLookupByCodeSuccessfully() {
        when(reservationRepository.findByCodeAndFacilityId("RSV-20261001-1234", 1L))
                .thenReturn(Optional.of(rsv));

        ReservationResponse res = service.lookupForCheckIn("RSV-20261001-1234", 1L);

        assertNotNull(res);
        assertEquals("RSV-20261001-1234", res.getCode());
        verify(reservationRepository).findByCodeAndFacilityId("RSV-20261001-1234", 1L);
    }

    @Test
    @DisplayName("T3.5: lookup theo ma RSV-... khong tim thay nem RESERVATION_NOT_FOUND")
    void shouldThrowNotFound_whenCodeDoesNotExist() {
        when(reservationRepository.findByCodeAndFacilityId("RSV-99999999-0000", 1L))
                .thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> service.lookupForCheckIn("RSV-99999999-0000", 1L));
        assertEquals(ErrorCode.RESERVATION_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("T3.5: lookup theo so dien thoai / CCCD thanh cong")
    void shouldLookupByContactSuccessfully() {
        when(reservationRepository.findByCustomerContactAndFacility("0912345678", 1L))
                .thenReturn(List.of(rsv));

        ReservationResponse res = service.lookupForCheckIn("0912345678", 1L);

        assertNotNull(res);
        assertEquals("RSV-20261001-1234", res.getCode());
        verify(reservationRepository).findByCustomerContactAndFacility("0912345678", 1L);
    }

    @Test
    @DisplayName("T3.5: lookup theo phone/CCCD khong co ket qua nem RESERVATION_NOT_FOUND")
    void shouldThrowNotFound_whenContactHasNoReservations() {
        when(reservationRepository.findByCustomerContactAndFacility("0999999999", 1L))
                .thenReturn(Collections.emptyList());

        CustomException ex = assertThrows(CustomException.class,
                () -> service.lookupForCheckIn("0999999999", 1L));
        assertEquals(ErrorCode.RESERVATION_NOT_FOUND, ex.getErrorCode());
    }
}