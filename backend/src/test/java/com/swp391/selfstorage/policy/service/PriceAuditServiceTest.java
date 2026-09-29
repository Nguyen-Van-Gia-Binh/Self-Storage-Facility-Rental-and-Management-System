package com.swp391.selfstorage.policy.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.PriceAuditEntryResponse;
import com.swp391.selfstorage.policy.dto.PriceAuditPageResponse;
import com.swp391.selfstorage.policy.entity.ExtraFeeVersion;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.ExtraFeeVersionRepository;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.impl.PriceAuditServiceImpl;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePriceVersion;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceVersionRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class PriceAuditServiceTest {

    @Mock
    private FacilityUnitTypePriceVersionRepository priceVersionRepository;
    @Mock
    private ExtraFeeVersionRepository extraFeeVersionRepository;
    @Mock
    private PolicyVersionRepository policyVersionRepository;
    @Mock
    private FacilityRepository facilityRepository;
    @Mock
    private UnitTypeRepository unitTypeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AppliedPriceLookup appliedPriceLookup;

    private PriceAuditService service;

    @BeforeEach
    void setUp() {
        service = new PriceAuditServiceImpl(
                priceVersionRepository,
                extraFeeVersionRepository,
                policyVersionRepository,
                facilityRepository,
                unitTypeRepository,
                userRepository,
                appliedPriceLookup);
    }

    @Test
    @DisplayName("Nhật ký giá thuê hiện giá cũ sang giá mới, người đổi và vẫn kèm chính sách toàn hệ thống")
    void rentHistoryShowsOldToNewAndPolicyDiff() {
        OffsetDateTime earlier = OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusDays(20);
        OffsetDateTime later = OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        FacilityUnitTypePriceVersion older = FacilityUnitTypePriceVersion.builder()
                .id(1L)
                .facilityId(10L)
                .unitTypeId(3L)
                .pricePerM2(450_000L)
                .monthlyPrice(450_000L)
                .effectiveFrom(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusDays(20))
                .createdBy(7L)
                .createdAt(earlier)
                .build();
        FacilityUnitTypePriceVersion newer = FacilityUnitTypePriceVersion.builder()
                .id(2L)
                .facilityId(10L)
                .unitTypeId(3L)
                .pricePerM2(480_000L)
                .monthlyPrice(480_000L)
                .effectiveFrom(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")))
                .createdBy(7L)
                .createdAt(later)
                .build();
        FacilityUnitTypePriceVersion otherFacility = FacilityUnitTypePriceVersion.builder()
                .id(3L)
                .facilityId(99L)
                .unitTypeId(3L)
                .pricePerM2(100_000L)
                .monthlyPrice(100_000L)
                .effectiveFrom(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")))
                .createdBy(7L)
                .createdAt(later)
                .build();

        PolicyVersion first = PolicyVersion.builder()
                .id(11L)
                .versionNo(1)
                .effectiveFrom(earlier)
                .depositMultiplier(new BigDecimal("1.0"))
                .overdueDailyRate(new BigDecimal("0.10"))
                .publishedBy(7L)
                .createdAt(earlier)
                .build();
        PolicyVersion second = PolicyVersion.builder()
                .id(12L)
                .versionNo(2)
                .effectiveFrom(later)
                .depositMultiplier(new BigDecimal("1.5"))
                .overdueDailyRate(new BigDecimal("0.10"))
                .publishedBy(7L)
                .createdAt(later)
                .build();

        Facility facility = new Facility();
        facility.setId(10L);
        facility.setName("Cơ sở Quận 7");
        AppUser actor = new AppUser();
        actor.setId(7L);
        actor.setFullName("Nguyễn BOM");
        UnitType unitType = UnitType.builder().id(3L).name("Kho Nhỏ").build();

        when(priceVersionRepository.findAll()).thenReturn(List.of(older, newer, otherFacility));
        when(extraFeeVersionRepository.findAll()).thenReturn(List.of());
        when(policyVersionRepository.findAll()).thenReturn(List.of(first, second));
        when(appliedPriceLookup.versionStatus(any(), any())).thenReturn(AppliedPriceInfo.STATUS_APPLIED);
        when(facilityRepository.findAllById(any())).thenReturn(List.of(facility));
        when(userRepository.findAllById(any())).thenReturn(List.of(actor));
        when(unitTypeRepository.findAll()).thenReturn(List.of(unitType));

        PriceAuditPageResponse page = service.search("ALL", 10L, null, null, null, 0, 20);

        PriceAuditEntryResponse rent = page.getContent().stream()
                .filter(entry -> "RENT-2".equals(entry.getId()))
                .findFirst()
                .orElseThrow();
        assertTrue(rent.getChangeSummary().contains("450.000"));
        assertTrue(rent.getChangeSummary().contains("480.000"));
        assertEquals("Nguyễn BOM", rent.getActorName());
        assertEquals("Cơ sở Quận 7 · Kho Nhỏ", rent.getSubject());
        assertTrue(page.getContent().stream().noneMatch(entry -> "RENT-3".equals(entry.getId())));

        PriceAuditEntryResponse policy = page.getContent().stream()
                .filter(entry -> "POLICY-12".equals(entry.getId()))
                .findFirst()
                .orElseThrow();
        assertTrue(policy.getChangeSummary().contains("Hệ số cọc 1 → 1.5"));
        assertTrue(!policy.getChangeSummary().contains("Phí quá hạn"));
        assertEquals("Toàn hệ thống", policy.getFacilityName());
    }

    @Test
    @DisplayName("Phụ phí ghi mức cũ sang mức mới")
    void surchargeHistoryShowsAmountChange() {
        OffsetDateTime earlier = OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusDays(5);
        OffsetDateTime later = OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        ExtraFeeVersion first = ExtraFeeVersion.builder()
                .id(1L)
                .extraFeeTypeId(4L)
                .code("LOCK")
                .name("Phí khóa")
                .amount(50_000L)
                .feeType("FIXED")
                .isActive(true)
                .effectiveFrom(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusDays(5))
                .createdAt(earlier)
                .build();
        ExtraFeeVersion second = ExtraFeeVersion.builder()
                .id(2L)
                .extraFeeTypeId(4L)
                .code("LOCK")
                .name("Phí khóa")
                .amount(80_000L)
                .feeType("FIXED")
                .isActive(true)
                .effectiveFrom(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")))
                .createdBy(7L)
                .createdAt(later)
                .build();
        AppUser actor = new AppUser();
        actor.setId(7L);
        actor.setFullName("Nguyễn BOM");

        when(extraFeeVersionRepository.findAll()).thenReturn(List.of(first, second));
        when(userRepository.findAllById(any())).thenReturn(List.of(actor));

        PriceAuditPageResponse page = service.search("SURCHARGE", null, null, null, null, 0, 20);

        assertEquals(2, page.getContent().size());
        assertTrue(page.getContent().get(0).getChangeSummary().contains("50.000 đ → 80.000 đ"));
        assertEquals("Phí khóa · Toàn hệ thống", page.getContent().get(0).getSubject());
        assertEquals("Nguyễn BOM", page.getContent().get(0).getActorName());
        assertEquals("Không rõ", page.getContent().get(1).getActorName());
    }
}
