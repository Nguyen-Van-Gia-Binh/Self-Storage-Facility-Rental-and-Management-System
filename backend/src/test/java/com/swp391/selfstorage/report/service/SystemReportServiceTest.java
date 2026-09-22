package com.swp391.selfstorage.report.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;
import com.swp391.selfstorage.report.service.impl.SystemReportServiceImpl;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemReportServiceTest {

    @Mock
    private FacilityRepository facilityRepository;

    @Mock
    private StorageUnitRepository storageUnitRepository;

    @Mock
    private RentalContractRepository rentalContractRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @InjectMocks
    private SystemReportServiceImpl systemReportService;

    private Facility facility1;
    private Facility facility2;

    @BeforeEach
    void setUp() {
        facility1 = new Facility();
        facility1.setId(1L);
        facility1.setName("Cơ sở Cầu Giấy");
        facility1.setStatus(FacilityStatus.ACTIVE);

        facility2 = new Facility();
        facility2.setId(2L);
        facility2.setName("Cơ sở Đống Đa");
        facility2.setStatus(FacilityStatus.ACTIVE);

    }

    @Test
    @DisplayName("US-BM-04.1: Báo cáo doanh thu toàn hệ thống thành công và bóc tách đúng dòng tiền")
    void testSystemRevenueReport_Success() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 31);

        when(facilityRepository.findAll()).thenReturn(List.of(facility1, facility2));

        RentalContract c1 = RentalContract.builder()
                .id(101L)
                .facilityId(1L)
                .totalRentalFee(5_000_000L)
                .overdueFeeAccrued(500_000L)
                .endDateExclusive(LocalDate.of(2026, 10, 20))
                .build();

        RentalContract c2 = RentalContract.builder()
                .id(102L)
                .facilityId(2L)
                .totalRentalFee(8_000_000L)
                .overdueFeeAccrued(0L)
                .endDateExclusive(LocalDate.of(2026, 10, 25))
                .build();

        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(c1));
        when(rentalContractRepository.findByFacilityId(2L)).thenReturn(List.of(c2));

        // Mock giao dịch thanh toán cho c1
        PaymentTransaction p1 = PaymentTransaction.builder()
                .id(1L)
                .contractId(101L)
                .amount(5_000_000L)
                .transactionType("INITIAL_PAYMENT")
                .status("SUCCESS")
                .build();
        p1.setCreatedAt(java.time.Instant.parse("2026-10-05T03:00:00Z"));

        PaymentTransaction pExtra = PaymentTransaction.builder()
                .id(2L)
                .contractId(101L)
                .amount(200_000L)
                .transactionType("EXTRA_FEE_PAYMENT")
                .status("SUCCESS")
                .build();
        pExtra.setCreatedAt(java.time.Instant.parse("2026-10-10T10:00:00Z"));

        when(paymentTransactionRepository.findByContractId(101L)).thenReturn(List.of(p1, pExtra));

        // Mock giao dịch thanh toán cho c2
        PaymentTransaction p2 = PaymentTransaction.builder()
                .id(3L)
                .contractId(102L)
                .amount(8_000_000L)
                .transactionType("INITIAL_PAYMENT")
                .status("SUCCESS")
                .build();
        p2.setCreatedAt(java.time.Instant.parse("2026-10-08T10:00:00Z"));

        when(paymentTransactionRepository.findByContractId(102L)).thenReturn(List.of(p2));

        // Thực thi
        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(from, to, null);

        // Kiểm tra kết quả
        assertNotNull(report);
        assertEquals(13_700_000L, report.getTotalRevenue());
        assertEquals(13_000_000L, report.getRentalRevenue());
        assertEquals(200_000L, report.getSurchargeRevenue());
        assertEquals(500_000L, report.getOverdueFeeRevenue());
        assertEquals(2, report.getByFacility().size());

        // Tổng doanh thu từng cơ sở phải bằng tổng toàn hệ thống
        long sumByFacility = report.getByFacility().stream().mapToLong(f -> f.getRevenue()).sum();
        assertEquals(report.getTotalRevenue(), sumByFacility);
    }

    @Test
    @DisplayName("US-BM-04.1 AC-4: Ném VALIDATION_FAILED khi ngày kết thúc nhỏ hơn ngày bắt đầu")
    void testSystemRevenueReport_InvalidDateRange() {
        LocalDate from = LocalDate.of(2026, 10, 31);
        LocalDate to = LocalDate.of(2026, 10, 1);

        CustomException ex = assertThrows(CustomException.class,
                () -> systemReportService.getSystemRevenueReport(from, to, null));

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-BM-04.1 AC-5: Ném FACILITY_NOT_FOUND khi cơ sở chỉ định không tồn tại")
    void testSystemRevenueReport_FacilityNotFound() {
        when(facilityRepository.findById(999L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> systemReportService.getSystemRevenueReport(null, null, 999L));

        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-BM-04.1 AC-5: Xử lý an toàn khi hệ thống không có dữ liệu doanh thu")
    void testSystemRevenueReport_EmptyData() {
        when(facilityRepository.findAll()).thenReturn(Collections.emptyList());

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(null, null, null);

        assertNotNull(report);
        assertEquals(0L, report.getTotalRevenue());
        assertEquals(0L, report.getRentalRevenue());
        assertEquals(0L, report.getSurchargeRevenue());
        assertEquals(0L, report.getOverdueFeeRevenue());
        assertTrue(report.getByFacility().isEmpty());
    }

    @Test
    @DisplayName("US-BM-04.2: Báo cáo tỷ lệ lấp đầy và sắp xếp các cơ sở giảm dần theo tỷ lệ")
    void testSystemOccupancyReport_Success_DescendingSort() {
        when(facilityRepository.findAll()).thenReturn(List.of(facility1, facility2));

        // Facility 1: 10 ô kho, 2 occupied, 8 available -> 2/10 = 0.200 (20%)
        List<StorageUnit> units1 = List.of(
                StorageUnit.builder().id(1L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(2L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(3L).status(StorageUnitStatus.AVAILABLE).build(),
                StorageUnit.builder().id(4L).status(StorageUnitStatus.AVAILABLE).build());
        when(storageUnitRepository.findByFacilityId(1L)).thenReturn(units1);

        // Facility 2: 4 ô kho, 3 occupied, 1 available -> 3/4 = 0.750 (75%)
        List<StorageUnit> units2 = List.of(
                StorageUnit.builder().id(5L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(6L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(7L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(8L).status(StorageUnitStatus.AVAILABLE).build());
        when(storageUnitRepository.findByFacilityId(2L)).thenReturn(units2);

        SystemOccupancyReportResponse report = systemReportService.getSystemOccupancyReport(null);

        assertNotNull(report);
        assertEquals(8, report.getTotalUnits());
        assertEquals(5, report.getTotalOccupiedUnits());
        assertEquals(3, report.getTotalAvailableUnits());
        // Tỷ lệ lấp đầy toàn hệ thống: 5 / 8 = 0.625
        assertEquals(0.625, report.getOverallOccupancyRate());

        // Kiểm tra sắp xếp giảm dần: Facility 2 (0.75) phải đứng trước Facility 1 (0.5)
        assertEquals(2, report.getFacilities().size());
        assertEquals(2L, report.getFacilities().get(0).getFacilityId());
        assertEquals(0.75, report.getFacilities().get(0).getOccupancyRate());
        assertEquals(1L, report.getFacilities().get(1).getFacilityId());
        assertEquals(0.5, report.getFacilities().get(1).getOccupancyRate());
    }

    @Test
    @DisplayName("US-BM-04.2 AC-4: Xử lý an toàn khi mẫu số = 0 (toàn bộ ô kho bị OUT_OF_SERVICE)")
    void testSystemOccupancyReport_ZeroDivisionSafety() {
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));

        List<StorageUnit> units = List.of(
                StorageUnit.builder().id(1L).status(StorageUnitStatus.OUT_OF_SERVICE).build(),
                StorageUnit.builder().id(2L).status(StorageUnitStatus.OUT_OF_SERVICE).build());
        when(storageUnitRepository.findByFacilityId(1L)).thenReturn(units);

        SystemOccupancyReportResponse report = systemReportService.getSystemOccupancyReport(null);

        assertNotNull(report);
        // Mẫu số: total (2) - outOfService (2) = 0 -> tỷ lệ phải là 0.0, không được lỗi
        // chia 0
        assertEquals(0.0, report.getOverallOccupancyRate());
        assertEquals(0.0, report.getFacilities().get(0).getOccupancyRate());
        assertEquals(2, report.getFacilities().get(0).getOutOfServiceUnits());
    }
}
