package com.swp391.selfstorage.report.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractRenewal;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.ContractRenewalRepository;
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

    @Mock
    private ContractRenewalRepository contractRenewalRepository;

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
        assertEquals(13_200_000L, report.getTotalRevenue());
        assertEquals(13_000_000L, report.getRentalRevenue());
        assertEquals(200_000L, report.getSurchargeRevenue());
        assertEquals(0L, report.getOverdueFeeRevenue());
        assertEquals(2, report.getByFacility().size());

        long sumByFacility = report.getByFacility().stream().mapToLong(f -> f.getRevenue()).sum();
        assertEquals(report.getTotalRevenue(), sumByFacility);

        assertNotNull(report.getMonthlyTrends());
        assertEquals(12, report.getMonthlyTrends().size());
        assertEquals("2026-10", report.getMonthlyTrends().get(11).getMonth());
        assertEquals("T10/26", report.getMonthlyTrends().get(11).getMonthLabel());
        assertEquals(13_200_000L, report.getMonthlyTrends().get(11).getCashFlow());
    }

    @Test
    @DisplayName("US-BM-04.1: tách cọc, gia hạn, phạt và hoàn tiền khỏi doanh thu thuê")
    void testSystemRevenueReport_SplitsDepositRenewalOverdueAndRefund() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 31);
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));

        RentalContract contract = RentalContract.builder()
                .id(201L)
                .facilityId(1L)
                .totalRentalFee(3_000_000L)
                .depositAmount(1_000_000L)
                .build();
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(contract));

        PaymentTransaction initial = PaymentTransaction.builder()
                .contractId(201L).amount(4_000_000L).transactionType("INITIAL_PAYMENT").status("SUCCESS").build();
        initial.setCreatedAt(java.time.Instant.parse("2026-10-02T03:00:00Z"));
        PaymentTransaction renewal = PaymentTransaction.builder()
                .contractId(201L).amount(3_000_000L).transactionType("CONTRACT_RENEWAL").status("SUCCESS").build();
        renewal.setCreatedAt(java.time.Instant.parse("2026-10-03T03:00:00Z"));
        PaymentTransaction penalty = PaymentTransaction.builder()
                .contractId(201L).amount(100_000L).transactionType("OVERDUE_PENALTY").status("SUCCESS").build();
        penalty.setCreatedAt(java.time.Instant.parse("2026-10-04T03:00:00Z"));
        PaymentTransaction refund = PaymentTransaction.builder()
                .contractId(201L).amount(200_000L).transactionType("REFUND").status("PENDING_REFUND").build();
        refund.setCreatedAt(java.time.Instant.parse("2026-10-05T03:00:00Z"));
        when(paymentTransactionRepository.findByContractId(201L)).thenReturn(List.of(initial, renewal, penalty, refund));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(from, to, null);

        assertEquals(2_800_000L, report.getRentalRevenue());
        assertEquals(1_000_000L, report.getDepositBalance());
        assertEquals(3_000_000L, report.getRenewalRevenue());
        assertEquals(100_000L, report.getOverdueFeeRevenue());
        assertEquals(200_000L, report.getTotalRefundAmount());
        assertEquals(5_900_000L, report.getTotalRevenue());
    }

    @Test
    @DisplayName("Enterprise Flow 4: Tính Net MRR thực tế sau chiết khấu và bóc tách Tiền cọc đang giữ (Deposit Liability)")
    void testSystemRevenueReport_CalculatesNetMrrAndDepositLiability() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 31);
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));

        // Hợp đồng 1: Thuê 6 tháng, giá niêm yết 2.000.000/tháng (tổng 12tr), chiết khấu còn 10.800.000đ
        // Net MRR = 10.800.000 / 6 = 1.800.000đ/tháng (thay vì giá ảo 2.000.000đ)
        RentalContract contract1 = RentalContract.builder()
                .id(401L)
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .rentalMonths(6)
                .monthlyPrice(2_000_000L)
                .totalRentalFee(10_800_000L)
                .depositAmount(2_000_000L)
                .depositBalance(2_000_000L)
                .build();

        // Hợp đồng 2: Thuê 1 tháng không chiết khấu 1.500.000đ, trạng thái OVERDUE
        // Không tính vào MRR (vì không ACTIVE), nhưng depositBalance 1.200.000đ vẫn tính vào Deposit Liability
        RentalContract contract2 = RentalContract.builder()
                .id(402L)
                .facilityId(1L)
                .status(ContractStatus.OVERDUE)
                .rentalMonths(1)
                .monthlyPrice(1_500_000L)
                .totalRentalFee(1_500_000L)
                .depositAmount(1_500_000L)
                .depositBalance(1_200_000L)
                .build();

        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(contract1, contract2));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(from, to, null);

        assertNotNull(report);
        assertEquals(1_800_000L, report.getMrr(), "Net MRR phải tính trên giá thực tế sau chiết khấu");
        assertEquals(1L, report.getActiveContractCount(), "Chỉ có 1 hợp đồng ACTIVE");
        assertEquals(3_200_000L, report.getTotalDepositLiability(), "Deposit Liability phải bóc tách tiền cọc đang nắm giữ");
    }

    @Test
    @DisplayName("Test Case 3.1 (Chỉ số Dòng tiền - Cash Flow): Chỉ tính giao dịch SUCCESS, không cộng gộp PENDING")
    void testSystemRevenueReport_CashFlowOnlyIncludesSuccess() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 31);
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));

        RentalContract contract = RentalContract.builder()
                .id(501L)
                .facilityId(1L)
                .totalRentalFee(5_000_000L)
                .depositAmount(0L)
                .build();
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(contract));

        // 1 giao dịch SUCCESS 5 triệu
        PaymentTransaction successTxn = PaymentTransaction.builder()
                .contractId(501L).amount(5_000_000L).transactionType("INITIAL_PAYMENT").status("SUCCESS").build();
        successTxn.setCreatedAt(java.time.Instant.parse("2026-10-05T03:00:00Z"));

        // 1 giao dịch PENDING 2 triệu (đang treo)
        PaymentTransaction pendingTxn = PaymentTransaction.builder()
                .contractId(501L).amount(2_000_000L).transactionType("CONTRACT_RENEWAL").status("PENDING").build();
        pendingTxn.setCreatedAt(java.time.Instant.parse("2026-10-06T03:00:00Z"));

        when(paymentTransactionRepository.findByContractId(501L)).thenReturn(List.of(successTxn, pendingTxn));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(from, to, null);

        // Kỳ vọng: Dòng tiền thực thu chỉ là 5.000.000đ, không được cộng gộp 2.000.000đ của giao dịch PENDING
        assertEquals(5_000_000L, report.getTotalRevenue());
        assertEquals(5_000_000L, report.getRentalRevenue());
        assertEquals(0L, report.getRenewalRevenue(), "Giao dịch renewal PENDING không được tính vào doanh thu");
    }

    @Test
    @DisplayName("US-BM-04.1: Gộp INITIAL_PAYMENT gắn reservationId vào doanh thu thuê và cọc")
    void testSystemRevenueReport_IncludesReservationLinkedInitialPayment() {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));

        RentalContract contract = RentalContract.builder()
                .id(301L)
                .facilityId(1L)
                .reservationId(501L)
                .totalRentalFee(2_000_000L)
                .depositAmount(1_000_000L)
                .build();
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(contract));
        when(paymentTransactionRepository.findByContractId(301L)).thenReturn(Collections.emptyList());

        PaymentTransaction initial = PaymentTransaction.builder()
                .id(90L)
                .reservationId(501L)
                .amount(3_000_000L)
                .transactionType("INITIAL_PAYMENT")
                .status("SUCCESS")
                .build();
        initial.setCreatedAt(java.time.Instant.parse("2026-09-10T03:00:00Z"));
        when(paymentTransactionRepository.findByReservationId(501L)).thenReturn(List.of(initial));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(from, to, null);

        assertEquals(2_000_000L, report.getRentalRevenue());
        assertEquals(1_000_000L, report.getDepositBalance());
        assertEquals(2_000_000L, report.getTotalRevenue());
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
        assertNull(report.getOverallOccupancyRate());
        assertNull(report.getFacilities().get(0).getOccupancyRate());
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

    @Test
    @DisplayName("REP-02: Khách đóng trước 6 tháng (12tr) -> Cash Flow +12tr, MRR +2tr")
    void testSystemRevenueReport_CashFlowVsMrr_6MonthsPrepaid() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 31);
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));

        RentalContract prepaidContract = RentalContract.builder()
                .id(601L)
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .rentalMonths(6)
                .monthlyPrice(2_000_000L)
                .totalRentalFee(12_000_000L)
                .depositAmount(0L)
                .depositBalance(0L)
                .build();
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(prepaidContract));

        PaymentTransaction initialPaid = PaymentTransaction.builder()
                .id(61L)
                .contractId(601L)
                .amount(12_000_000L)
                .transactionType("INITIAL_PAYMENT")
                .status("SUCCESS")
                .build();
        initialPaid.setCreatedAt(java.time.Instant.parse("2026-10-10T03:00:00Z"));
        when(paymentTransactionRepository.findByContractId(601L)).thenReturn(List.of(initialPaid));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(from, to, null);

        assertEquals(12_000_000L, report.getTotalRevenue(), "Cash Flow tháng này phải ghi nhận đủ +12tr thực thu");
        assertEquals(2_000_000L, report.getMrr(), "MRR tháng này chỉ ghi nhận +2tr doanh thu định kỳ");
    }

    @Test
    @DisplayName("REP-03: Cơ sở có 10 ô, 6 đang thuê, 1 bảo trì (Maintenance) -> Occupancy = 6 / (10 - 1) = 66.7%")
    void testSystemOccupancyReport_ExcludesMaintenanceFromDenominator() {
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));

        List<StorageUnit> units = List.of(
                StorageUnit.builder().id(1L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(2L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(3L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(4L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(5L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(6L).status(StorageUnitStatus.OCCUPIED).build(),
                StorageUnit.builder().id(7L).status(StorageUnitStatus.AVAILABLE).build(),
                StorageUnit.builder().id(8L).status(StorageUnitStatus.AVAILABLE).build(),
                StorageUnit.builder().id(9L).status(StorageUnitStatus.AVAILABLE).build(),
                StorageUnit.builder().id(10L).status(StorageUnitStatus.MAINTENANCE).build());
        when(storageUnitRepository.findByFacilityId(1L)).thenReturn(units);

        SystemOccupancyReportResponse report = systemReportService.getSystemOccupancyReport(null);

        assertEquals(0.667, report.getOverallOccupancyRate());
        assertEquals(0.667, report.getFacilities().get(0).getOccupancyRate());
    }

    @Test
    @DisplayName("REP-04 (Tech Lead Guardrail #3): Khoản hoàn cọc đang chờ chuyển (PENDING_REFUND) vẫn tính vào Nợ cọc (Deposit Liability)")
    void testSystemRevenueReport_PendingRefundStillCountsAsDepositLiability() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 31);
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));

        RentalContract activeContract = RentalContract.builder()
                .id(701L)
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .rentalMonths(1)
                .monthlyPrice(2_000_000L)
                .totalRentalFee(2_000_000L)
                .depositBalance(30_000_000L)
                .build();

        RentalContract returnedPendingRefundContract = RentalContract.builder()
                .id(702L)
                .facilityId(1L)
                .status(ContractStatus.RETURNED)
                .depositBalance(0L)
                .build();

        when(rentalContractRepository.findByFacilityId(1L))
                .thenReturn(List.of(activeContract, returnedPendingRefundContract));
        when(paymentTransactionRepository.findByContractId(701L)).thenReturn(Collections.emptyList());

        PaymentTransaction pendingRefundTxn = PaymentTransaction.builder()
                .id(71L)
                .contractId(702L)
                .amount(10_000_000L)
                .transactionType("REFUND")
                .status("PENDING_REFUND")
                .build();
        pendingRefundTxn.setCreatedAt(java.time.Instant.parse("2026-10-15T03:00:00Z"));
        when(paymentTransactionRepository.findByContractId(702L)).thenReturn(List.of(pendingRefundTxn));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(from, to, null);

        assertEquals(40_000_000L, report.getTotalDepositLiability(),
                "30tr đang giữ + 10tr PENDING_REFUND chưa chuyển khoản vẫn là Nợ phải trả (40tr)");
        assertEquals(0L, report.getTotalRevenue(), "Tuyệt đối không cộng tiền cọc vào Doanh thu");
    }

    @Test
    @DisplayName("MRR sau gia hạn lấy snapshot tháng, không chia tổng tiền thuê cho số tháng đã cộng dồn")
    void mrrAfterRenewalUsesMonthlySnapshot() {
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));
        RentalContract contract = RentalContract.builder()
                .id(801L)
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .rentalMonths(6)
                .monthlyPrice(1_000_000L)
                .totalRentalFee(3_000_000L)
                .depositAmount(0L)
                .build();
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(contract));
        when(contractRenewalRepository.findTopByContractIdOrderByCreatedAtDesc(801L))
                .thenReturn(Optional.of(ContractRenewal.builder()
                        .contractId(801L)
                        .monthlyPriceSnapshot(1_000_000L)
                        .build()));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), null);

        assertEquals(1_000_000L, report.getMrr());
    }

    @Test
    @DisplayName("§14 hủy 26/09: doanh thu thuê 400_000, cọc mất 400_000, REFUND_FAILED không tính, nợ hoàn chỉ phần cọc")
    void cancelRefundBooksForfeitedDepositAndIgnoresFailedRefund() {
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));
        RentalContract contract = RentalContract.builder()
                .id(901L)
                .facilityId(1L)
                .status(ContractStatus.CANCELLED)
                .totalRentalFee(2_400_000L)
                .depositAmount(800_000L)
                .depositBalance(0L)
                .build();
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(contract));

        PaymentTransaction paid = PaymentTransaction.builder()
                .id(91L).contractId(901L).amount(3_200_000L)
                .transactionType("INITIAL_PAYMENT").status("SUCCESS").build();
        paid.setPaidAt(java.time.Instant.parse("2026-09-20T03:00:00Z"));
        PaymentTransaction refund = PaymentTransaction.builder()
                .id(92L).contractId(901L).amount(2_800_000L)
                .transactionType("REFUND").status("PENDING_REFUND").build();
        refund.setPaidAt(java.time.Instant.parse("2026-09-26T03:00:00Z"));
        PaymentTransaction failed = PaymentTransaction.builder()
                .id(93L).contractId(901L).amount(9_000_000L)
                .transactionType("REFUND").status("REFUND_FAILED").build();
        failed.setPaidAt(java.time.Instant.parse("2026-09-26T04:00:00Z"));
        when(paymentTransactionRepository.findByContractId(901L)).thenReturn(List.of(paid, refund, failed));

        SystemRevenueReportResponse report = systemReportService.getSystemRevenueReport(
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), null);

        assertEquals(400_000L, report.getRentalRevenue());
        assertEquals(400_000L, report.getForfeitedDeposit());
        assertEquals(2_800_000L, report.getTotalRefundAmount());
        assertEquals(400_000L, report.getTotalDepositLiability());
    }

    @Test
    @DisplayName("Nợ quá hạn sau khi đóng phạt là 0, không fallback về giá tháng")
    void overdueDebtIsZeroAfterPenaltyPaid() {
        LocalDate today = LocalDate.now();
        RentalContract contract = RentalContract.builder()
                .id(1L).code("CTR-PAID").customerId(10L).facilityId(1L).storageUnitId(101L)
                .endDateExclusive(today.minusDays(2))
                .overdueFeeAccrued(0L)
                .monthlyPrice(1_200_000L)
                .status(ContractStatus.OVERDUE)
                .build();
        when(rentalContractRepository.findAll()).thenReturn(List.of(contract));
        when(userRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(storageUnitRepository.findAllById(any())).thenReturn(Collections.emptyList());
        when(facilityRepository.findAllById(any())).thenReturn(List.of(facility1));

        PageResponse<OverdueContractDetailDto> page = systemReportService.getSystemOverdueContracts(
                null, null, PageRequest.of(0, 10));

        assertEquals(0L, page.getContent().get(0).getTotalOutstandingDebt());
    }

    @Test
    @DisplayName("Doanh thu lọc theo paid_at, không theo ngày tạo checkout")
    void revenueUsesPaidAtNotCreatedAt() {
        when(facilityRepository.findAll()).thenReturn(List.of(facility1));
        RentalContract contract = RentalContract.builder()
                .id(911L).facilityId(1L).status(ContractStatus.ACTIVE)
                .totalRentalFee(1_000_000L).depositAmount(0L).build();
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(contract));
        PaymentTransaction paid = PaymentTransaction.builder()
                .id(1L).contractId(911L).amount(1_000_000L)
                .transactionType("INITIAL_PAYMENT").status("SUCCESS").build();
        paid.setCreatedAt(java.time.Instant.parse("2026-10-31T16:55:00Z"));
        paid.setPaidAt(java.time.Instant.parse("2026-10-31T17:05:00Z"));
        when(paymentTransactionRepository.findByContractId(911L)).thenReturn(List.of(paid));

        SystemRevenueReportResponse october = systemReportService.getSystemRevenueReport(
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31), null);
        SystemRevenueReportResponse november = systemReportService.getSystemRevenueReport(
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30), null);

        assertEquals(0L, october.getRentalRevenue());
        assertEquals(1_000_000L, november.getRentalRevenue());
    }
}
