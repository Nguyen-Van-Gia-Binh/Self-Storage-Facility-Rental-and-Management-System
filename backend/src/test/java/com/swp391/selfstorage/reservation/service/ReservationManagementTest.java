package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationManagementTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @InjectMocks private ReservationServiceImpl service;

    private Reservation rsv;

    @BeforeEach
    void setUp() {
        rsv = new Reservation();
        rsv.setId(201L);
        rsv.setCode("RSV-20260921-1234");
        rsv.setFacilityId(1L);
        rsv.setCustomerId(5L);
        rsv.setUnitTypeId(2L);
        rsv.setStorageUnitId(10L);
        rsv.setStartDate(LocalDate.of(2026, 10, 1));
        rsv.setRentalMonths(3);
        rsv.setEndDateExclusive(LocalDate.of(2027, 1, 1));
        rsv.setMonthlyPriceSnapshot(1_200_000L);
        rsv.setDiscountAmount(0L);
        rsv.setDepositAmount(1_200_000L);
        rsv.setTotalRentalFee(3_600_000L);
        rsv.setTotalPayable(4_800_000L);
        rsv.setStatus(ReservationStatus.PENDING_PAYMENT);
        rsv.setHoldExpiresAt(OffsetDateTime.now().plusHours(48));
    }

    @Test
    @DisplayName("Tra cứu đơn đặt chỗ theo mã code thành công khi tồn tại")
    void shouldReturnReservationResponse_whenGetReservationByCodeExists() {
        when(reservationRepository.findByCode("RSV-20260921-1234")).thenReturn(Optional.of(rsv));

        ReservationResponse response = service.getReservationByCode("RSV-20260921-1234");

        assertNotNull(response);
        assertEquals(rsv.getId(), response.getId());
        assertEquals("RSV-20260921-1234", response.getCode());
        assertEquals(rsv.getTotalPayable(), response.getTotalPayable());
        verify(reservationRepository).findByCode("RSV-20260921-1234");
    }

    @Test
    @DisplayName("Tra cứu đơn đặt chỗ ném ngoại lệ RESERVATION_NOT_FOUND khi mã code không tồn tại")
    void shouldThrowReservationNotFound_whenGetReservationByCodeDoesNotExist() {
        when(reservationRepository.findByCode("RSV-NOT-FOUND")).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> service.getReservationByCode("RSV-NOT-FOUND"));

        assertEquals(ErrorCode.RESERVATION_NOT_FOUND, ex.getErrorCode());
        verify(reservationRepository).findByCode("RSV-NOT-FOUND");
    }

    @Test
    @DisplayName("BR-RES-04: Hủy đơn đặt chỗ thành công khi trạng thái đang là PENDING_PAYMENT")
    void shouldCancelReservationSuccessfully_whenStatusIsPendingPayment() {
        rsv.setStatus(ReservationStatus.PENDING_PAYMENT);
        when(reservationRepository.findByCode("RSV-20260921-1234")).thenReturn(Optional.of(rsv));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        service.cancelReservation("RSV-20260921-1234");

        assertEquals(ReservationStatus.CANCELLED, rsv.getStatus());
        assertNotNull(rsv.getCancelledAt(), "Thời điểm hủy đơn cancelledAt phải được cập nhật");
        verify(reservationRepository).save(rsv);
    }

    @Test
    @DisplayName("BR-RES-04: Từ chối hủy đơn (ném INVALID_STATUS_TRANSITION) khi trạng thái đã là CONFIRMED")
    void shouldThrowInvalidStatusTransition_whenCancelReservationAlreadyConfirmed() {
        rsv.setStatus(ReservationStatus.CONFIRMED);
        when(reservationRepository.findByCode("RSV-20260921-1234")).thenReturn(Optional.of(rsv));

        CustomException ex = assertThrows(CustomException.class,
                () -> service.cancelReservation("RSV-20260921-1234"));

        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
        assertEquals("Chi co the huy don dat cho khi chua thanh toan", ex.getMessage());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("BR-RES-04: Từ chối hủy đơn (ném INVALID_STATUS_TRANSITION) khi trạng thái đã là FULFILLED")
    void shouldThrowInvalidStatusTransition_whenCancelReservationAlreadyFulfilled() {
        rsv.setStatus(ReservationStatus.FULFILLED);
        when(reservationRepository.findByCode("RSV-20260921-1234")).thenReturn(Optional.of(rsv));

        CustomException ex = assertThrows(CustomException.class,
                () -> service.cancelReservation("RSV-20260921-1234"));

        assertEquals(ErrorCode.INVALID_STATUS_TRANSITION, ex.getErrorCode());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lấy danh sách đơn đặt chỗ của khách hàng sắp xếp giảm dần theo thời gian tạo (createdAt DESC)")
    void shouldReturnCustomerReservations_orderedByCreatedAtDesc() {
        Reservation rsv2 = new Reservation();
        rsv2.setId(202L);
        rsv2.setCode("RSV-20260921-5678");
        rsv2.setFacilityId(1L);
        rsv2.setCustomerId(5L);
        rsv2.setUnitTypeId(3L);
        rsv2.setStatus(ReservationStatus.CONFIRMED);
        rsv2.setStartDate(LocalDate.now());
        rsv2.setRentalMonths(6);
        rsv2.setEndDateExclusive(LocalDate.now().plusMonths(6));
        rsv2.setHoldExpiresAt(OffsetDateTime.now().plusHours(48));

        when(reservationRepository.findByCustomerIdOrderByCreatedAtDesc(5L)).thenReturn(List.of(rsv, rsv2));

        List<ReservationResponse> list = service.getCustomerReservations(5L);

        assertNotNull(list);
        assertEquals(2, list.size());
        assertEquals("RSV-20260921-1234", list.get(0).getCode());
        assertEquals("RSV-20260921-5678", list.get(1).getCode());
        verify(reservationRepository).findByCustomerIdOrderByCreatedAtDesc(5L);
    }

    @Test
    @DisplayName("Trả về danh sách rỗng khi khách hàng chưa có đơn đặt chỗ nào")
    void shouldReturnEmptyList_whenCustomerHasNoReservations() {
        when(reservationRepository.findByCustomerIdOrderByCreatedAtDesc(99L)).thenReturn(Collections.emptyList());

        List<ReservationResponse> list = service.getCustomerReservations(99L);

        assertNotNull(list);
        assertTrue(list.isEmpty());
        verify(reservationRepository).findByCustomerIdOrderByCreatedAtDesc(99L);
    }
}
