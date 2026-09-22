package com.swp391.selfstorage.report.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
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
import com.swp391.selfstorage.report.dto.OverdueContractDetailDto;
import com.swp391.selfstorage.report.dto.ReportExportType;
import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;
import com.swp391.selfstorage.report.service.impl.SystemReportServiceImpl;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SystemReportServiceImpl systemReportService;

    private Facility facility1;
    private Facility facility2;
    private UserPrincipal mockPrincipal;

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

        mockPrincipal = new UserPrincipal(
                1L, "bom@selfstorage.vn", "hash", "Nguyễn Văn BOM",
                UserRole.BUSINESS_OPERATIONS_MANAGER, UserStatus.ACTIVE, Collections.emptyList(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_BUSINESS_OPERATIONS_MANAGER")));
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

        PaymentTransaction p2 = PaymentTransaction.builder()
                .id(3L)
                .contractId(102L)
                .amount(8_000_000L)
                .transactionType("INITIAL_PAYMENT")
                .status("SUCCESS")
                .build();
        p2.setCreatedAt(java.time.Instant.parse("2026-10-08T10:00:00Z"));

        when(paymentTransactionRepository.findByContractId(102L)).thenReturn(List.of(p2));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(from, to, null);

        assertNotNull(report);
        assertEquals(13_700_000L, report.getTotalRevenue());
        assertEquals(13_000_000L, report.getRentalRevenue());
        assertEquals(200_000L, report.getSurchargeRevenue());
        assertEquals(500_000L, report.getOverdueFeeRevenue());
        assertEquals(2, report.getByFacility().size());

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

        List<StorageUnit> units1 = List.of(
                StorageUnit.builder().id(1L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(2L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(3L).status(StorageUnitStatus.AVAILABLE).build(),
                StorageUnit.builder().id(4L).status(StorageUnitStatus.AVAILABLE).build());
        when(storageUnitRepository.findByFacilityId(1L)).thenReturn(units1);

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
        assertEquals(0.625, report.getOverallOccupancyRate());

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
        assertEquals(0.0, report.getOverallOccupancyRate());
        assertEquals(0.0, report.getFacilities().get(0).getOccupancyRate());
        assertEquals(2, report.getFacilities().get(0).getOutOfServiceUnits());
    }

    // ==================== CÁC TEST CASES MỚI CHO BM-05 ====================

    @Test
    @DisplayName("US-BM-05.1: Lấy danh sách hợp đồng quá hạn thành công và sắp xếp giảm dần theo số ngày trễ")
    void testSystemOverdueContracts_Success_SortedDescending() {
        LocalDate today = LocalDate.now();

        RentalContract c1 = RentalContract.builder()
                .id(1L).code("CTR-001").customerId(10L).facilityId(1L).storageUnitId(101L)
                .endDateExclusive(today.minusDays(5)) // Trễ 5 ngày
                .overdueFeeAccrued(500_000L).monthlyPrice(2_000_000L).status(ContractStatus.OVERDUE)
                .build();

        RentalContract c2 = RentalContract.builder()
                .id(2L).code("CTR-002").customerId(11L).facilityId(2L).storageUnitId(102L)
                .endDateExclusive(today.minusDays(15)) // Trễ 15 ngày
                .overdueFeeAccrued(1_500_000L).monthlyPrice(3_000_000L).status(ContractStatus.OVERDUE)
                .build();

        when(rentalContractRepository.findAll()).thenReturn(List.of(c1, c2));

        AppUser u1 = new AppUser();

        u1.setId(10L);
        u1.setFullName("Nguyễn Văn A");
        u1.setPhone("0901234567");
        u1.setEmail("a@gmail.com");

        AppUser u2 = new AppUser();
        u2.setId(11L);
        u2.setFullName("Trần Thị B");
        u2.setPhone("0909876543");
        u2.setEmail("b@gmail.com");
        
        when(userRepository.findAllById(any())).thenReturn(List.of(u1, u2));

        StorageUnit unit1 = StorageUnit.builder().id(101L).code("U-101").build();
        StorageUnit unit2 = StorageUnit.builder().id(102L).code("U-102").build();
        when(storageUnitRepository.findAllById(any())).thenReturn(List.of(unit1, unit2));

        when(facilityRepository.findAllById(any())).thenReturn(List.of(facility1, facility2));

        PageResponse<OverdueContractDetailDto> response = systemReportService.getSystemOverdueContracts(null, null,
                PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(2, response.getTotalElements());
        // c2 (trễ 15 ngày) phải đứng trước c1 (trễ 5 ngày)
        assertEquals("CTR-002", response.getContent().get(0).getContractCode());
        assertEquals(15, response.getContent().get(0).getOverdueDays());
        assertEquals("CTR-001", response.getContent().get(1).getContractCode());
        assertEquals(5, response.getContent().get(1).getOverdueDays());
    }

    @Test
    @DisplayName("US-BM-05.1: Lọc hợp đồng quá hạn theo số ngày tối thiểu (minOverdueDays)")
    void testSystemOverdueContracts_FilterByMinDays() {
        LocalDate today = LocalDate.now();

        RentalContract c1 = RentalContract.builder()
                .id(1L).code("CTR-001").customerId(10L).facilityId(1L).storageUnitId(101L)
                .endDateExclusive(today.minusDays(5)) // Trễ 5 ngày
                .overdueFeeAccrued(500_000L).monthlyPrice(2_000_000L).status(ContractStatus.OVERDUE)
                .build();

        RentalContract c2 = RentalContract.builder()
                .id(2L).code("CTR-002").customerId(11L).facilityId(2L).storageUnitId(102L)

                .endDateExclusive(today.minusDays(15)) // Trễ 15 ngày
                .overdueFeeAccrued(1_500_000L).monthlyPrice(3_000_000L).status(ContractStatus.OVERDUE)
                .build();

        when(rentalContractRepository.findAll()).thenReturn(List.of(c1, c2));
        when(userRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(storageUnitRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(facilityRepository.findAllById(any())).thenReturn(Collections.emptyList());

        // Lọc các hợp đồng quá hạn >= 10 ngày -> chỉ c2 thỏa mãn
        PageResponse<OverdueContractDetailDto> response = systemReportService.getSystemOverdueContracts(null, 10,
                PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals("CTR-002", response.getContent().get(0).getContractCode());
    }

    @Test
    @DisplayName("US-BM-05.1 AC-2: Xuất file báo cáo doanh thu CSV có BOM UTF-8 và metadata")
    void testExportSystemReport_Revenue() {
        when(facilityRepository.findAll()).thenReturn(Collections.emptyList());

        byte[] csvBytes = systemReportService.exportSystemReport(ReportExportType.REVENUE, null, null, null,
                mockPrincipal);

        assertNotNull(csvBytes);
        String csvContent = new String(csvBytes, StandardCharsets.UTF_8);

        assertTrue(csvContent.startsWith("\uFEFF"), "File CSV phải bắt đầu bằng UTF-8 BOM");

        assertTrue(csvContent.contains("# BÁO CÁO DOANH THU TOÀN HỆ THỐNG"));
        assertTrue(csvContent.contains("Nguyễn Văn BOM (bom@selfstorage.vn)"));
        assertTrue(csvContent.contains("TỔNG QUAN DOANH THU"));
    }

    @Test
    @DisplayName("US-BM-05.1 AC-2: Xuất file báo cáo tỷ lệ lấp đầy CSV")
    void testExportSystemReport_Occupancy() {
        when(facilityRepository.findAll()).thenReturn(Collections.emptyList());

        byte[] csvBytes = systemReportService.exportSystemReport(ReportExportType.OCCUPANCY, null, null, null,
                mockPrincipal);

        assertNotNull(csvBytes);
        String csvContent = new String(csvBytes, StandardCharsets.UTF_8);

        assertTrue(csvContent.startsWith("\uFEFF"));
        assertTrue(csvContent.contains("# BÁO CÁO TỶ LỆ LẤP ĐẦY TOÀN HỆ THỐNG"));
        assertTrue(csvContent.contains("TỶ LỆ LẤP ĐẦY"));
    }

    @Test
    @DisplayName("US-BM-05.1 AC-4: Xuất file báo cáo danh sách nợ quá hạn rỗng vẫn có tiêu đề và ghi chú")
    void testExportSystemReport_Overdue_Empty() {
        when(rentalContractRepository.findAll()).thenReturn(Collections.emptyList());

        byte[] csvBytes = systemReportService.exportSystemReport(ReportExportType.OVERDUE, null, null, null,
                mockPrincipal);

        assertNotNull(csvBytes);
        String csvContent = new String(csvBytes, StandardCharsets.UTF_8);

        assertTrue(csvContent.startsWith("\uFEFF"));
        assertTrue(csvContent.contains("# BÁO CÁO DANH SÁCH HỢP ĐỒNG NỢ QUÁ HẠN"));
        assertTrue(csvContent.contains("# Không có dữ liệu trong kỳ báo cáo"));
    }
}
