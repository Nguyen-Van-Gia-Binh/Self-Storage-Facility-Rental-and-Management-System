package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.reservation.dto.*;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerCheckInTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @Mock private FacilityRepository facilityRepository;
    @Mock private UnitTypeRepository unitTypeRepository;
    @Mock private FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;
    @Mock private RentalContractRepository rentalContractRepository;

    @InjectMocks
    private ReservationServiceImpl reservationService;

    private UserPrincipal customerUser;
    private Reservation confirmedReservation;
    private Facility facility;
    private StorageUnit storageUnit;
    private UnitType unitType;
    private RentalContract contract;

    @BeforeEach
    void setUp() {
        customerUser = new UserPrincipal(
                15L, "customer@test.com", "pass", "Customer Test",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList()
        );

        facility = new Facility();
        facility.setId(1L);
        facility.setCode("FAC-01");
        facility.setName("Kho Tự Quản Tân Thuận");
        facility.setAddress("123 Nguyễn Thị Thập, Quận 7");
        facility.setPhone("0281234567");
        facility.setStatus(FacilityStatus.ACTIVE);

        unitType = new UnitType();
        unitType.setId(7L);
        unitType.setCode("UT-S-01");
        unitType.setName("Loại S — 3m²");
        unitType.setWidthM(java.math.BigDecimal.valueOf(1.5));
        unitType.setLengthM(java.math.BigDecimal.valueOf(2.0));
        unitType.setHeightM(java.math.BigDecimal.valueOf(2.5));
        unitType.setActive(true);

        storageUnit = new StorageUnit();
        storageUnit.setId(42L);
        storageUnit.setCode("S-101");
        storageUnit.setFacilityId(1L);
        storageUnit.setUnitTypeId(7L);
        storageUnit.setFloor(1);
        storageUnit.setPosition("Dãy A");
        storageUnit.setStatus(StorageUnitStatus.RESERVED);

        confirmedReservation = new Reservation();
        confirmedReservation.setId(1042L);
        confirmedReservation.setCode("RSV-2026-001042");
        confirmedReservation.setCustomerId(15L);
        confirmedReservation.setFacilityId(1L);
        confirmedReservation.setUnitTypeId(7L);
        confirmedReservation.setStorageUnitId(42L);
        confirmedReservation.setStartDate(LocalDate.now().plusDays(2));
        confirmedReservation.setRentalMonths(3);
        confirmedReservation.setEndDateExclusive(LocalDate.now().plusDays(2).plusMonths(3));
        confirmedReservation.setMonthlyPriceSnapshot(800000L);
        confirmedReservation.setDepositAmount(800000L);
        confirmedReservation.setTotalRentalFee(2400000L);
        confirmedReservation.setTotalPayable(3200000L);
        confirmedReservation.setStatus(ReservationStatus.CONFIRMED);
        confirmedReservation.setHoldExpiresAt(OffsetDateTime.now().plusDays(2));

        contract = new RentalContract();
        contract.setId(500L);
        contract.setCode("CTR-2026-000500");
        contract.setReservationId(1042L);
        contract.setCustomerId(15L);
        contract.setFacilityId(1L);
        contract.setStorageUnitId(42L);
        contract.setStartDate(LocalDate.now().plusDays(2));
        contract.setEndDateExclusive(LocalDate.now().plusDays(2).plusMonths(3));
        contract.setMonthlyPrice(800000L);
        contract.setDepositAmount(800000L);
        contract.setStatus(ContractStatus.PENDING_CHECK_IN);
        contract.setAccessCode("482019");
    }

    @Test
    @DisplayName("US-SC-04.1: Tra cứu thông tin lịch hẹn check-in thành công")
    void shouldReturnCheckInInfo_whenReservationExistsAndBelongsToCustomer() {
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(confirmedReservation));
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facility));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(storageUnit));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitType));
        when(rentalContractRepository.findByReservationId(1042L)).thenReturn(Optional.of(contract));

        CheckInInfoResponse response = reservationService.getCheckInInfo(1042L, customerUser);

        assertNotNull(response);
        assertEquals(1042L, response.getReservationId());
        assertEquals("RSV-2026-001042", response.getReservationCode());
        assertEquals(500L, response.getContractId());
        assertEquals("CTR-2026-000500", response.getContractCode());
        assertEquals("Kho Tự Quản Tân Thuận", response.getFacilityName());
        assertEquals("S-101", response.getStorageUnitCode());
        assertNotNull(response.getGracePeriodEnd());
        assertEquals(confirmedReservation.getStartDate().plusDays(10), response.getGracePeriodEnd());
        assertNotNull(response.getCheckinToken());
        assertNotNull(response.getRequiredDocuments());
        assertFalse(response.getRequiredDocuments().isEmpty());
    }

    @Test
    @DisplayName("US-SC-04.1: Báo lỗi ACCESS_DENIED khi khách xem đơn của người khác")
    void shouldThrowException_whenReservationNotBelongsToCustomer() {
        UserPrincipal otherCustomer = new UserPrincipal(
                999L, "other@test.com", "pass", "Other",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList()
        );
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(confirmedReservation));

        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.getCheckInInfo(1042L, otherCustomer));
        assertEquals(ErrorCode.ACCESS_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-04.2: Khách hàng xác nhận đã nhận kho thành công và nhận mã Access Code")
    void shouldConfirmCustomerCheckIn_successfully_andReturnAccessCode() {
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(confirmedReservation));
        when(rentalContractRepository.findByReservationId(1042L)).thenReturn(Optional.of(contract));
        when(storageUnitRepository.findById(42L)).thenReturn(Optional.of(storageUnit));

        CustomerCheckInConfirmRequest request = new CustomerCheckInConfirmRequest(
                true, true, "Đã nhận kho và kiểm tra cửa tốt"
        );

        CustomerCheckInResponse response = reservationService.confirmCustomerCheckIn(1042L, request, customerUser);

        assertNotNull(response);
        assertEquals(1042L, response.getReservationId());
        assertEquals("FULFILLED", response.getReservationStatus());
        assertEquals("482019", response.getAccessCode());
        assertEquals("S-101", response.getStorageUnitCode());
        assertEquals(ReservationStatus.FULFILLED, confirmedReservation.getStatus());
        assertNotNull(confirmedReservation.getFulfilledAt());
        verify(reservationRepository, times(1)).save(confirmedReservation);
    }

    @Test
    @DisplayName("US-SC-04.2: Báo lỗi khi đơn đặt chỗ chưa ở trạng thái CONFIRMED")
    void shouldThrowException_whenConfirmCheckInOnUnconfirmedReservation() {
        confirmedReservation.setStatus(ReservationStatus.PENDING_PAYMENT);
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(confirmedReservation));

        CustomerCheckInConfirmRequest request = new CustomerCheckInConfirmRequest(true, true, null);

        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.confirmCustomerCheckIn(1042L, request, customerUser));
        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-SC-04.3: Dời lịch hẹn check-in thành công trong thời hạn 10 ngày")
    void shouldRescheduleAppointmentSuccessfully_withinGracePeriod() {
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(confirmedReservation));

        LocalDate newDate = confirmedReservation.getStartDate().plusDays(5);
        RescheduleAppointmentRequest request = new RescheduleAppointmentRequest(newDate, "Bận việc đột xuất");

        CheckInInfoResponse response = reservationService.rescheduleAppointment(1042L, request, customerUser);

        assertNotNull(response);
        assertEquals(newDate, response.getStartDate());
        verify(reservationRepository, times(1)).save(confirmedReservation);
    }

    @Test
    @DisplayName("US-SC-04.3: Báo lỗi khi dời lịch hẹn vượt quá 10 ngày ân hạn (BR-CAN-04)")
    void shouldRejectReschedule_whenExceedingGracePeriod() {
        when(reservationRepository.findById(1042L)).thenReturn(Optional.of(confirmedReservation));

        LocalDate tooLateDate = confirmedReservation.getStartDate().plusDays(11);
        RescheduleAppointmentRequest request = new RescheduleAppointmentRequest(tooLateDate, "Xin dời quá 10 ngày");

        CustomException ex = assertThrows(CustomException.class, () ->
                reservationService.rescheduleAppointment(1042L, request, customerUser));
        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }
}
