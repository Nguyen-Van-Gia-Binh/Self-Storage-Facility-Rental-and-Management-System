package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.reservation.dto.CreateReservationRequest;
import com.swp391.selfstorage.reservation.dto.ReservationResponse;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationCreationTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private StorageUnitRepository storageUnitRepository;
    @Mock private RentalContractRepository rentalContractRepository;
    @Mock private FacilityUnitTypePriceRepository facilityUnitTypePriceRepository;
    @Mock private PolicyVersionRepository policyVersionRepository;
    @InjectMocks private ReservationServiceImpl service;

    private CreateReservationRequest request;
    private UserPrincipal testCustomer;

    @BeforeEach
    void setUp() {
        testCustomer = new UserPrincipal(
                1L, "nguyenvana@example.com", "password", "Nguyễn Văn A",
                UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE, Collections.emptyList(), Collections.emptyList()
        );

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

        StorageUnit availableUnit = new StorageUnit();
        availableUnit.setId(10L);
        availableUnit.setFacilityId(1L);
        availableUnit.setUnitTypeId(2L);
        availableUnit.setStatus(StorageUnitStatus.AVAILABLE);
        lenient().when(storageUnitRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(availableUnit));

        PolicyVersion policy = PolicyVersion.builder()
                .id(1L)
                .reservationHoldHours(48)
                .rentalBufferDays(15)
                .rentalDailyDivisor(30)
                .renewalMinMonths(1)
                .renewalMaxMonths(12)
                .build();
        lenient().when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any()))
                .thenReturn(Optional.of(policy));

        FacilityUnitTypePrice price = new FacilityUnitTypePrice();
        price.setMonthlyPrice(1200000L);
        lenient().when(facilityUnitTypePriceRepository.findByFacilityIdAndUnitTypeId(1L, 2L)).thenReturn(Optional.of(price));
        lenient().when(rentalContractRepository.existsOverlappingContractForUnit(eq(10L), any(), any(), anyInt(), eq(0L)))
                .thenReturn(false);
        lenient().when(reservationRepository.existsActivePendingByCustomerId(any(), any(), any()))
                .thenReturn(false);
    }

    @Test
    @DisplayName("Ném ngoại lệ UNAUTHORIZED khi người dùng chưa đăng nhập (currentUser == null)")
    void shouldThrowUnauthorized_whenCurrentUserIsNull() {
        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, null));
        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());
        assertEquals("Vui lòng đăng nhập tài khoản để đặt chỗ lưu trữ.", exception.getMessage());
    }

    @Test
    @DisplayName("Tạo đơn đặt chỗ thành công khi ô kho trống (AVAILABLE)")
    void shouldCreateReservationSuccessfully_whenUnitIsAvailable() {
        when(reservationRepository.existsOverlappingReservationForUnit(eq(10L), any(), any(), any(), eq(15))).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(500L);
            return r;
        });

        ReservationResponse response = service.createReservation(request, testCustomer);

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
                any(OffsetDateTime.class),
                eq(15)
        )).thenReturn(false);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(505L);
            return r;
        });

        ReservationResponse response = service.createReservation(request, testCustomer);

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
        // Khách thuê bắt đầu đúng ngày kỳ cũ kết thúc
        LocalDate testStartDate = LocalDate.now().plusDays(10);
        request.setStartDate(testStartDate);
        request.setRentalMonths(3);

        when(reservationRepository.existsOverlappingReservationForUnit(
                eq(10L),
                eq(testStartDate),
                eq(testStartDate.plusMonths(3)),
                any(OffsetDateTime.class),
                eq(15)
        )).thenReturn(false);

        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(506L);
            return r;
        });

        ReservationResponse response = service.createReservation(request, testCustomer);

        assertNotNull(response);
        assertEquals(testStartDate, response.getStartDate());
        assertEquals(testStartDate.plusMonths(3), response.getEndDateExclusive());
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("BR-RES-02 & BR-AVL-04: Ném ngoại lệ UNIT_NOT_AVAILABLE khi ô kho đã được người khác giữ chỗ trùng lịch")
    void shouldThrowUnitNotAvailable_whenUnitIsAlreadyTaken() {
        when(reservationRepository.existsOverlappingReservationForUnit(
                eq(10L), any(), any(), any(), eq(15)
        )).thenReturn(true);

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));

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
        when(storageUnitRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(unit));

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));

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
        when(storageUnitRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(unit));

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));

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
        when(storageUnitRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(unit));

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));

        assertEquals(ErrorCode.STORAGE_UNIT_NOT_FOUND, exception.getErrorCode());
        assertEquals("O kho khong thuoc co so hoac loai o kho da chon", exception.getMessage());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném ngoại lệ INVALID_START_DATE khi ngày bắt đầu thuê ở trong quá khứ")
    void shouldThrowInvalidStartDate_whenStartDateIsInThePast() {
        request.setStartDate(LocalDate.now().minusDays(1));

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));

        assertEquals(ErrorCode.INVALID_START_DATE, exception.getErrorCode());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("BR-AVL-04: Từ chối đặt chỗ khi khách không chọn ô kho cụ thể")
    void shouldRejectReservation_whenNoSpecificUnitSelected() {
        request.setStorageUnitId(null);

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));

        assertEquals(ErrorCode.UNIT_NOT_AVAILABLE, exception.getErrorCode());
        assertEquals("Khach phai chon dung o kho", exception.getMessage());
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    @DisplayName("BR-AVL-02: Từ chối khi hợp đồng hiện hữu còn giao khoảng đệm 15 ngày")
    void shouldRejectReservation_whenContractOverlapsWithinBuffer() {
        when(rentalContractRepository.existsOverlappingContractForUnit(eq(10L), any(), any(), eq(15), eq(0L)))
                .thenReturn(true);

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));

        assertEquals(ErrorCode.UNIT_NOT_AVAILABLE, exception.getErrorCode());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Không bịa giá 1.200.000 khi cơ sở chưa cấu hình đơn giá")
    void shouldRejectReservation_whenPriceIsMissing() {
        when(facilityUnitTypePriceRepository.findByFacilityIdAndUnitTypeId(1L, 2L)).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));

        assertEquals(ErrorCode.UNIT_TYPE_NOT_FOUND, exception.getErrorCode());
        verify(reservationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo thông tin chuyển khoản VietQR Napas247 chính xác theo mã đơn đặt chỗ")
    void shouldGenerateCorrectTransferContentAndVietQrPayload() {
        when(reservationRepository.existsOverlappingReservationForUnit(eq(10L), any(), any(), any(), eq(15))).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
            Reservation r = inv.getArgument(0);
            r.setId(502L);
            return r;
        });

        ReservationResponse response = service.createReservation(request, testCustomer);

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

        when(reservationRepository.existsOverlappingReservationForUnit(eq(10L), any(), any(), any(), eq(15))).thenReturn(false);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservationResponse response = service.createReservation(request, testCustomer);

        assertEquals(LocalDate.of(2026, 11, 1), response.getStartDate());
        assertEquals(LocalDate.of(2027, 5, 1), response.getEndDateExclusive());
        assertEquals(6, response.getRentalMonths());
    }

    @Test
    @DisplayName("Ném ngoại lệ PENDING_RESERVATION_EXISTS khi khách hàng đã có đơn giữ chỗ chưa thanh toán")
    void shouldThrowPendingReservationExists_whenCustomerAlreadyHasActivePendingReservation() {
        when(reservationRepository.existsActivePendingByCustomerId(eq(testCustomer.getId()), eq(ReservationStatus.PENDING_PAYMENT), any(OffsetDateTime.class)))
                .thenReturn(true);

        CustomException exception = assertThrows(CustomException.class, () -> service.createReservation(request, testCustomer));
        assertEquals(ErrorCode.PENDING_RESERVATION_EXISTS, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("thanh toán"));
    }
}
