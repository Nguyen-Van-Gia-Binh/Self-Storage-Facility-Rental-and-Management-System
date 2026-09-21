package com.swp391.selfstorage.report.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.report.dto.FacilityOverviewReportResponse;
import com.swp391.selfstorage.report.dto.OverdueDebtReportResponse;
import com.swp391.selfstorage.report.service.impl.FacilityReportServiceImpl;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FacilityReportServiceTest {

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
    private FacilityReportServiceImpl reportService;

    private Facility testFacility;
    private UserPrincipal facilityManagerPrincipal;
    private UserPrincipal unauthorizedManagerPrincipal;
    private UserPrincipal bomPrincipal;

    @BeforeEach
    void setUp() {
        testFacility = new Facility();
        testFacility.setId(1L);
        testFacility.setCode("FAC-Q1");
        testFacility.setName("Kho Quận 1");
        testFacility.setStatus(FacilityStatus.ACTIVE);

        facilityManagerPrincipal = new UserPrincipal(
                10L, "manager@test.com", "hash", "Manager Q1",
                UserRole.FACILITY_MANAGER, UserStatus.ACTIVE, List.of(1L),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_FACILITY_MANAGER"))
        );

        unauthorizedManagerPrincipal = new UserPrincipal(
                11L, "othermanager@test.com", "hash", "Manager Q2",
                UserRole.FACILITY_MANAGER, UserStatus.ACTIVE, List.of(2L),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_FACILITY_MANAGER"))
        );

        bomPrincipal = new UserPrincipal(
                20L, "bom@test.com", "hash", "BOM User",
                UserRole.BUSINESS_OPERATIONS_MANAGER, UserStatus.ACTIVE, Collections.emptyList(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_BUSINESS_OPERATIONS_MANAGER"))
        );
    }

    @Test
    @DisplayName("AC-1 & AC-2: Tính toán chính xác các chỉ số ô kho và tỷ lệ lấp đầy")
    void testGetFacilityOverview_OccupancyCalculation() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(testFacility));

        List<StorageUnit> units = new ArrayList<>();
        // 22 occupied
        for (int i = 1; i <= 22; i++) {
            units.add(StorageUnit.builder().id((long) i).facilityId(1L).code("U-" + i).status(StorageUnitStatus.OCCUPIED).build());
        }
        // 5 available
        for (int i = 23; i <= 27; i++) {
            units.add(StorageUnit.builder().id((long) i).facilityId(1L).code("U-" + i).status(StorageUnitStatus.AVAILABLE).build());
        }
        // 3 maintenance
        for (int i = 28; i <= 30; i++) {
            units.add(StorageUnit.builder().id((long) i).facilityId(1L).code("U-" + i).status(StorageUnitStatus.MAINTENANCE).build());
        }

        when(storageUnitRepository.findByFacilityIdAndFilters(eq(1L), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(units));
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(Collections.emptyList());

        FacilityOverviewReportResponse response = reportService.getFacilityOverview(1L, "2026-10", facilityManagerPrincipal);

        assertNotNull(response);
        assertEquals(1L, response.getFacilityId());
        assertEquals("Kho Quận 1", response.getFacilityName());
        assertEquals("2026-10", response.getMonth());
        assertEquals(30, response.getTotalUnits());
        assertEquals(22, response.getOccupiedUnits());
        assertEquals(5, response.getAvailableUnits());
        assertEquals(3, response.getMaintenanceUnits());
        // 22 / 30 = 0.73333 -> round 0.733
        assertEquals(0.733, response.getOccupancyRate());
    }

    @Test
    @DisplayName("AC-2 Edge Case: Khi cơ sở chưa có ô kho hoặc tất cả OUT_OF_SERVICE -> rate = 0.0")
    void testGetFacilityOverview_ZeroExploitableUnits() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(testFacility));

        List<StorageUnit> units = List.of(
                StorageUnit.builder().id(1L).facilityId(1L).code("U-1").status(StorageUnitStatus.OUT_OF_SERVICE).build(),
                StorageUnit.builder().id(2L).facilityId(1L).code("U-2").status(StorageUnitStatus.OUT_OF_SERVICE).build()
        );

        when(storageUnitRepository.findByFacilityIdAndFilters(eq(1L), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(units));
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(Collections.emptyList());

        FacilityOverviewReportResponse response = reportService.getFacilityOverview(1L, "2026-10", facilityManagerPrincipal);

        assertNotNull(response);
        assertEquals(2, response.getTotalUnits());
        assertEquals(0, response.getOccupiedUnits());
        assertEquals(0.0, response.getOccupancyRate());
    }

    @Test
    @DisplayName("AC-3: Tính toán doanh thu theo tháng và số dư tiền cọc hiện hữu")
    void testGetFacilityOverview_FinancialRevenue() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(testFacility));
        when(storageUnitRepository.findByFacilityIdAndFilters(eq(1L), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        RentalContract c1 = RentalContract.builder()
                .id(101L)
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .totalRentalFee(24_000_000L)
                .depositBalance(17_600_000L)
                .startDate(LocalDate.of(2026, 10, 1))
                .build();

        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(c1));

        PaymentTransaction p1 = PaymentTransaction.builder()
                .id(1L)
                .contractId(101L)
                .transactionType("RENEWAL_PAYMENT")
                .amount(24_000_000L)
                .status("SUCCESS")
                .build();
        p1.setCreatedAt(java.time.Instant.parse("2026-10-05T03:00:00Z"));

        PaymentTransaction p2 = PaymentTransaction.builder()
                .id(2L)
                .contractId(101L)
                .transactionType("EXTRA_FEE_PAYMENT")
                .amount(1_600_000L)
                .status("SUCCESS")
                .build();
        p2.setCreatedAt(java.time.Instant.parse("2026-10-10T07:30:00Z"));

        when(paymentTransactionRepository.findByContractId(101L)).thenReturn(List.of(p1, p2));

        FacilityOverviewReportResponse response = reportService.getFacilityOverview(1L, "2026-10", facilityManagerPrincipal);

        assertNotNull(response);
        assertEquals(24_000_000L, response.getRentalRevenue());
        assertEquals(1_600_000L, response.getSurchargeRevenue());
        assertEquals(25_600_000L, response.getTotalRevenue());
        assertEquals(17_600_000L, response.getDepositBalance());
        assertEquals(1, response.getActiveContracts());
    }

    @Test
    @DisplayName("AC-4: Báo cáo rủi ro nợ quá hạn phân bổ chính xác theo 3 nhóm độ tuổi nợ")
    void testGetFacilityOverdueDebt_AgingBrackets() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(testFacility));

        LocalDate today = LocalDate.now();

        // Contract 1: Quá hạn 5 ngày -> D+1 .. D+10
        RentalContract c1 = RentalContract.builder()
                .id(201L)
                .code("CTR-201")
                .facilityId(1L)
                .customerId(1001L)
                .storageUnitId(301L)
                .endDateExclusive(today.minusDays(5))
                .status(ContractStatus.OVERDUE)
                .overdueFeeAccrued(500_000L)
                .monthlyPrice(2_000_000L)
                .build();

        // Contract 2: Quá hạn 20 ngày -> D+11 .. D+30
        RentalContract c2 = RentalContract.builder()
                .id(202L)
                .code("CTR-202")
                .facilityId(1L)
                .customerId(1002L)
                .storageUnitId(302L)
                .endDateExclusive(today.minusDays(20))
                .status(ContractStatus.OVERDUE)
                .overdueFeeAccrued(2_000_000L)
                .monthlyPrice(3_000_000L)
                .build();

        // Contract 3: Quá hạn 45 ngày -> Trên D+30
        RentalContract c3 = RentalContract.builder()
                .id(203L)
                .code("CTR-203")
                .facilityId(1L)
                .customerId(1003L)
                .storageUnitId(303L)
                .endDateExclusive(today.minusDays(45))
                .status(ContractStatus.OVERDUE)
                .overdueFeeAccrued(4_500_000L)
                .monthlyPrice(4_000_000L)
                .build();

        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(List.of(c1, c2, c3));

        AppUser u1 = new AppUser("user1@test.com", "hash", "Khách Hàng 1", "0901111111", "ID1", UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE);
        u1.setId(1001L);
        AppUser u2 = new AppUser("user2@test.com", "hash", "Khách Hàng 2", "0902222222", "ID2", UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE);
        u2.setId(1002L);
        AppUser u3 = new AppUser("user3@test.com", "hash", "Khách Hàng 3", "0903333333", "ID3", UserRole.STORAGE_CUSTOMER, UserStatus.ACTIVE);
        u3.setId(1003L);

        when(userRepository.findAllById(any())).thenReturn(List.of(u1, u2, u3));

        StorageUnit su1 = StorageUnit.builder().id(301L).code("U-301").build();
        StorageUnit su2 = StorageUnit.builder().id(302L).code("U-302").build();
        StorageUnit su3 = StorageUnit.builder().id(303L).code("U-303").build();

        when(storageUnitRepository.findAllById(any())).thenReturn(List.of(su1, su2, su3));

        OverdueDebtReportResponse response = reportService.getFacilityOverdueDebt(1L, facilityManagerPrincipal);

        assertNotNull(response);
        assertEquals(1L, response.getFacilityId());
        assertEquals(3, response.getTotalOverdueContracts());
        assertEquals(7_000_000L, response.getTotalOverdueDebt());

        // Bracket D1..D10
        assertEquals(1, response.getBracketD1ToD10().getContractCount());
        assertEquals(500_000L, response.getBracketD1ToD10().getTotalDebt());

        // Bracket D11..D30
        assertEquals(1, response.getBracketD11ToD30().getContractCount());
        assertEquals(2_000_000L, response.getBracketD11ToD30().getTotalDebt());

        // Bracket Over D30
        assertEquals(1, response.getBracketOverD30().getContractCount());
        assertEquals(4_500_000L, response.getBracketOverD30().getTotalDebt());

        // Sorting: highest overdue days first
        assertEquals("CTR-203", response.getContracts().get(0).getContractCode());
        assertEquals("CTR-202", response.getContracts().get(1).getContractCode());
        assertEquals("CTR-201", response.getContracts().get(2).getContractCode());
    }

    @Test
    @DisplayName("AC-5 & SA-03: Facility Manager truy cập đúng cơ sở được phân công -> Thành công")
    void testAccessControl_AssignedFacility_Success() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(testFacility));
        when(storageUnitRepository.findByFacilityIdAndFilters(eq(1L), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> reportService.getFacilityOverview(1L, "2026-10", facilityManagerPrincipal));
    }

    @Test
    @DisplayName("AC-5 & SA-03: Facility Manager truy cập cơ sở khác không được phân công -> 403 FACILITY_ACCESS_DENIED")
    void testAccessControl_UnassignedFacility_ThrowsException() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(testFacility));

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.getFacilityOverview(1L, "2026-10", unauthorizedManagerPrincipal)
        );

        assertEquals(ErrorCode.FACILITY_ACCESS_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("AC-5 & SA-03: BOM và ADMIN có thể truy cập bất kỳ cơ sở nào")
    void testAccessControl_BOM_CanAccessAnyFacility() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(testFacility));
        when(storageUnitRepository.findByFacilityIdAndFilters(eq(1L), eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));
        when(rentalContractRepository.findByFacilityId(1L)).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> reportService.getFacilityOverview(1L, "2026-10", bomPrincipal));
    }

    @Test
    @DisplayName("Báo cáo ném lỗi 404 khi cơ sở không tồn tại")
    void testFacilityNotFound_ThrowsException() {
        when(facilityRepository.findById(999L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () ->
                reportService.getFacilityOverview(999L, "2026-10", facilityManagerPrincipal)
        );

        assertEquals(ErrorCode.FACILITY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lọc danh sách hợp đồng cơ sở phân trang theo trạng thái và sắp hết hạn")
    @SuppressWarnings("unchecked")
    void testGetFacilityContracts_PagingAndFiltering() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(testFacility));

        RentalContract c1 = RentalContract.builder()
                .id(1L)
                .code("CTR-1")
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .endDateExclusive(LocalDate.now().plusDays(3))
                .build();

        Page<RentalContract> page = new PageImpl<>(List.of(c1), PageRequest.of(0, 10), 1);
        when(rentalContractRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<ContractSummaryResponse> response = reportService.getFacilityContracts(
                1L, ContractStatus.ACTIVE, 7, PageRequest.of(0, 10), facilityManagerPrincipal
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("CTR-1", response.getContent().get(0).getCode());
        assertTrue(response.getContent().get(0).isNearExpiration());
    }
}
