package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationCreationTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @InjectMocks private ReservationServiceImpl service;

    private CreateReservationRequest request;

    @BeforeEach
    void setUp() {
        request = new CreateReservationRequest();
        request.setFacilityId(1L);
        request.setUnitTypeId(2L);
        request.setStorageUnitId(10L);
        request.setStartDate(LocalDate.now().plusDays(2));
        request.setRentalMonths(3);
        request.setCustomerName("Nguyễn Văn A");
        request.setCustomerPhone("0987654321");
        request.setCustomerEmail("nguyenvana@example.com");
        request.setIdentityNumber("012345678901");
    }

    @Test
    @DisplayName("Tạo đơn đặt chỗ thành công khi ô kho trống (AVAILABLE)")
    void shouldCreateReservationSuccessfully_whenUnitIsAvailable() {
        when(reservationRepository.existsOverlappingReservationForUnit(eq(10L), any(), any(), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(500L);
            return r;
        });

        ReservationResponse response = service.createReservation(request);

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertTrue(response.getCode().startsWith("RSV-"), "Mã đặt chỗ phải có tiền tố RSV-");
        assertEquals(ReservationStatus.PENDING_PAYMENT.name(), response.getStatus());
        assertEquals(10L, response.getStorageUnitId());
        assertEquals("U-10", response.getStorageUnitCode());
        assertEquals(request.getStartDate(), response.getStartDate());
        assertEquals(request.getStartDate().plusMonths(request.getRentalMonths()), response.getEndDateExclusive());

        // BR-DEP-03: Giữ chỗ 48 giờ
        assertNotNull(response.getHoldExpiresAt());
        assertTrue(response.getHoldExpiresAt().isAfter(OffsetDateTime.now().plusHours(47)),
                "Thời hạn giữ chỗ phải khoảng 48 giờ sau thời điểm tạo");

        // Verify entity được lưu vào DB
        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        Reservation captured = captor.getValue();
        assertEquals(ReservationStatus.PENDING_PAYMENT, captured.getStatus());
        assertEquals(1L, captured.getCustomerId()); // Seed default customer
        assertEquals(request.getFacilityId(), captured.getFacilityId());
        assertEquals(request.getUnitTypeId(), captured.getUnitTypeId());
        assertEquals(request.getStorageUnitId(), captured.getStorageUnitId());
    }

    @Test
    @DisplayName("BR-AVL-04: Đặt trước cho khoảng thời gian tương lai không trùng lịch (Future Claim) -> Thành công")
    void shouldCreateReservation_whenFutureClaimDifferentYear_Success() {
        // Đặt trước cho năm 2027 (15/01/2027 đến 15/01/2028)
        request.setStartDate(LocalDate.of(2027, 1, 15));
        request.setRentalMonths(12);

        // Không có đơn nào giao thoa trong khoảng 2027 - 2028
        when(reservationRepository.existsOverlappingReservationForUnit(
                eq(10L),
                eq(LocalDate.of(2027, 1, 15)),
                eq(LocalDate.of(2028, 1, 15)),
                any(OffsetDateTime.class)
        )).thenReturn(false);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(505L);
            return r;
        });

        ReservationResponse response = service.createReservation(request);

        assertNotNull(response);
        assertEquals(505L, response.getId());
        assertEquals(LocalDate.of(2027, 1, 15), response.getStartDate());
        assertEquals(LocalDate.of(2028, 1, 15), response.getEndDateExclusive());
        assertEquals(12, response.getRentalMonths());
        assertEquals(ReservationStatus.PENDING_PAYMENT.name(), response.getStatus());
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("BR-AVL-02: Hai kỳ thuê liền kề (endExclusive kỳ trước == startDate kỳ sau) không bị tính là xung đột")
    void shouldCreateReservation_whenAdjacentTimeSlots_Success() {
        // Khách thuê bắt đầu đúng ngày kỳ cũ kết thúc (ví dụ 01/10/2026)
        request.setStartDate(LocalDate.of(2026, 10, 1));
        request.setRentalMonths(3);

        when(reservationRepository.existsOverlappingReservationForUnit(
                eq(10L),
                eq(LocalDate.of(2026, 10, 1)),
                eq(LocalDate.of(2027, 1, 1)),
                any(OffsetDateTime.class)
        )).thenReturn(false);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(506L);
            return r;
        });

        ReservationResponse response = service.createReservation(request);

        assertNotNull(response);
        assertEquals(LocalDate.of(2026, 10, 1), response.getStartDate());
        assertEquals(LocalDate.of(2027, 1, 1), response.getEndDateExclusive());
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("BR-RES-02 & BR-AVL-04: Ném ngoại lệ UNIT_NOT_AVAILABLE khi ô kho đã được người khác giữ chỗ trùng lịch")
    void shouldThrowUnitNotAvailable_whenUnitIsAlreadyTaken() {
        when(reservationRepository.existsOverlappingReservationForUnit(
                eq(10L), any(), any(), any()
        )).thenReturn(true);

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request));

        assertEquals(ErrorCode.UNIT_NOT_AVAILABLE, exception.getErrorCode());
        assertEquals("O kho nay da co nguoi khac giu cho trong thoi gian da chon", exception.getMessage());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("BR-AVL-01: Ném ngoại lệ UNIT_NOT_AVAILABLE khi ô kho đang trong trạng thái MAINTENANCE (Bảo trì)")
    void shouldThrowUnitNotAvailable_whenUnitIsInMaintenance() {
        StorageUnit unit = new StorageUnit();
        unit.setId(10L);
        unit.setFacilityId(1L);
        unit.setStatus(StorageUnitStatus.MAINTENANCE);
        when(storageUnitRepository.findById(10L)).thenReturn(Optional.of(unit));

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request));

        assertEquals(ErrorCode.UNIT_NOT_AVAILABLE, exception.getErrorCode());
        assertEquals("O kho dang trong che do bao tri hoac ngung hoat dong", exception.getMessage());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("BR-AVL-01: Ném ngoại lệ UNIT_NOT_AVAILABLE khi ô kho đang trong trạng thái OUT_OF_SERVICE (Ngừng hoạt động)")
    void shouldThrowUnitNotAvailable_whenUnitIsOutOfService() {
        StorageUnit unit = new StorageUnit();
        unit.setId(10L);
        unit.setFacilityId(1L);
        unit.setStatus(StorageUnitStatus.OUT_OF_SERVICE);
        when(storageUnitRepository.findById(10L)).thenReturn(Optional.of(unit));

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request));

        assertEquals(ErrorCode.UNIT_NOT_AVAILABLE, exception.getErrorCode());
        assertEquals("O kho dang trong che do bao tri hoac ngung hoat dong", exception.getMessage());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném ngoại lệ STORAGE_UNIT_NOT_FOUND khi ô kho thuộc cơ sở khác so với facilityId đã chọn")
    void shouldThrowStorageUnitNotFound_whenUnitBelongsToDifferentFacility() {
        StorageUnit unit = new StorageUnit();
        unit.setId(10L);
        unit.setFacilityId(99L); // Cơ sở khác 1L
        unit.setStatus(StorageUnitStatus.AVAILABLE);
        when(storageUnitRepository.findById(10L)).thenReturn(Optional.of(unit));

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request));

        assertEquals(ErrorCode.STORAGE_UNIT_NOT_FOUND, exception.getErrorCode());
        assertEquals("O kho khong thuoc co so hoac loai o kho da chon", exception.getMessage());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném ngoại lệ INVALID_START_DATE khi ngày bắt đầu thuê ở trong quá khứ")
    void shouldThrowInvalidStartDate_whenStartDateIsInThePast() {
        request.setStartDate(LocalDate.now().minusDays(1));

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request));

        assertEquals(ErrorCode.INVALID_START_DATE, exception.getErrorCode());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo đơn đặt chỗ thành công khi khách hàng chưa chọn ô kho cụ thể (storageUnitId == null)")
    void shouldCreateReservationSuccessfully_whenNoSpecificUnitSelected() {
        request.setStorageUnitId(null);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(501L);
            return r;
        });

        ReservationResponse response = service.createReservation(request);

        assertNotNull(response);
        assertNull(response.getStorageUnitId());
        assertEquals("Chua chon o", response.getStorageUnitCode());
        // Không kiểm tra ô kho trùng nếu storageUnitId == null
        verify(reservationRepository, never()).existsOverlappingReservationForUnit(any(), any(), any(), any());
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("BR-AVL-03: Ném ngoại lệ CAPACITY_NOT_AVAILABLE khi khách không chọn ô cụ thể nhưng loại kho đã hết capacity trống")
    void shouldThrowCapacityNotAvailable_whenNoSpecificUnitAndCapacityFull() {
        request.setStorageUnitId(null);

        // Tổng ô kho khai thác được = 5, nhưng đang có 3 reservation + 2 contract trùng lịch = 5 bận
        when(storageUnitRepository.countExploitableUnits(eq(1L), eq(2L), anyList())).thenReturn(5L);
        when(storageUnitRepository.countOverlappingReservations(eq(1L), eq(2L), any(), any())).thenReturn(3L);
        when(storageUnitRepository.countOverlappingContracts(eq(1L), eq(2L), any(), any())).thenReturn(2L);

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request));

        assertEquals(ErrorCode.CAPACITY_NOT_AVAILABLE, exception.getErrorCode());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo thông tin chuyển khoản VietQR Napas247 chính xác theo mã đơn đặt chỗ")
    void shouldGenerateCorrectTransferContentAndVietQrPayload() {
        when(reservationRepository.existsOverlappingReservationForUnit(eq(10L), any(), any(), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(502L);
            return r;
        });

        ReservationResponse response = service.createReservation(request);

        assertNotNull(response.getTransferContent());
        assertEquals("SMARTSTORAGE " + response.getCode(), response.getTransferContent());
        assertEquals("MB Bank (Ngan hang Quan Doi)", response.getBankName());
        assertEquals("0888 567 999", response.getBankAccountNumber());
        assertEquals("vietqr://" + response.getTotalPayable() + "/" + response.getTransferContent(),
                response.getVietQrPayload());
    }

    @Test
    @DisplayName("Khoảng thời gian thuê [start_date, end_date_exclusive) đúng chính xác theo số tháng thuê")
    void shouldCalculateCorrectRentalDateRange() {
        request.setStartDate(LocalDate.of(2026, 11, 1));
        request.setRentalMonths(6);

        when(reservationRepository.existsOverlappingReservationForUnit(eq(10L), any(), any(), any())).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = service.createReservation(request);

        assertEquals(LocalDate.of(2026, 11, 1), response.getStartDate());
        assertEquals(LocalDate.of(2027, 5, 1), response.getEndDateExclusive());
        assertEquals(6, response.getRentalMonths());
    }
}
