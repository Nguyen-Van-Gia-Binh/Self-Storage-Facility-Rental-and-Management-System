package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
    @DisplayName("BR-RES-02 & BR-AVL-04: Ném ngoại lệ UNIT_NOT_AVAILABLE khi ô kho đã được người khác giữ chỗ trùng lịch (PENDING_PAYMENT / CONFIRMED)")
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
