package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;
import com.swp391.selfstorage.policy.service.impl.PricingServiceImpl;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePriceVersion;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceVersionRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock private FacilityUnitTypePriceRepository priceRepository;
    @Mock private FacilityUnitTypePriceVersionRepository versionRepository;
    @Mock private FacilityRepository facilityRepository;
    @Mock private UnitTypeRepository unitTypeRepository;

    private PricingService pricingService;
    private Facility facilityQ1;
    private Facility facilityQ7;
    private UnitType unitTypeS;

    @BeforeEach
    void setUp() {
        pricingService = new PricingServiceImpl(
                priceRepository, versionRepository, facilityRepository, unitTypeRepository, null);

        facilityQ1 = new Facility();
        facilityQ1.setId(1L);
        facilityQ1.setName("Kho Quận 1");
        facilityQ1.setStatus(FacilityStatus.ACTIVE);

        facilityQ7 = new Facility();
        facilityQ7.setId(2L);
        facilityQ7.setName("Kho Quận 7");
        facilityQ7.setStatus(FacilityStatus.ACTIVE);

        unitTypeS = UnitType.builder()
                .id(7L)
                .code("UT-STD-S")
                .name("Kho Thường S")
                .widthM(new BigDecimal("2.00"))
                .lengthM(new BigDecimal("2.00"))
                .heightM(new BigDecimal("2.50"))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("PRI-01: Cập nhật giá theo cơ sở độc lập (Multi-facility) - tăng giá Q1 từ 4tr lên 5tr không ảnh hưởng Q7")
    void shouldUpdateFacilityPriceIndependently_withoutAffectingOtherFacilities() {
        FacilityUnitTypePrice q1Price = FacilityUnitTypePrice.builder()
                .id(10L).facilityId(1L).unitTypeId(7L).monthlyPrice(4_000_000L).pricePerM2(1_000_000L).version(0L).build();
        FacilityUnitTypePrice q7Price = FacilityUnitTypePrice.builder()
                .id(20L).facilityId(2L).unitTypeId(7L).monthlyPrice(4_000_000L).pricePerM2(1_000_000L).version(0L).build();

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facilityQ1));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitTypeS));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(q1Price));
        when(priceRepository.save(any(FacilityUnitTypePrice.class))).thenAnswer(inv -> inv.getArgument(0));

        FacilityPriceResponse updatedQ1 = pricingService.updatePrice(1L, 7L, new UpdatePriceRequest(5_000_000L));

        assertEquals(5_000_000L, updatedQ1.getMonthlyPrice());
        assertEquals(5_000_000L, q1Price.getMonthlyPrice());
        assertEquals(4_000_000L, q7Price.getMonthlyPrice(), "Giá tại Q7 phải giữ nguyên 4tr");
        verify(versionRepository).save(any(FacilityUnitTypePriceVersion.class));
    }

    @Test
    @DisplayName("PRI-02: Nhập giá âm (-5.000.000) bị chặn và ném VALIDATION_FAILED (400 Bad Request)")
    void shouldRejectNegativeOrInvalidPrice() {
        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facilityQ1));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitTypeS));

        CustomException ex = assertThrows(CustomException.class,
                () -> pricingService.updatePrice(1L, 7L, new UpdatePriceRequest(-5_000_000L)));

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        verify(priceRepository, never()).save(any());
    }

    @Test
    @DisplayName("PRI-03: Price Snapshot bất biến - Hợp đồng cũ của Khách A giữ nguyên 4tr sau khi BOM tăng giá lên 5tr")
    void shouldPreserveContractMonthlyPriceSnapshot_whenBomIncreasesPrice() {
        // Khách A đã ký hợp đồng với giá snapshot 4.000.000đ/tháng
        RentalContract existingContractA = RentalContract.builder()
                .id(100L)
                .facilityId(1L)
                .unitTypeId(7L)
                .status(ContractStatus.ACTIVE)
                .rentalMonths(3)
                .monthlyPrice(4_000_000L)
                .totalRentalFee(12_000_000L)
                .build();

        FacilityUnitTypePrice q1Price = FacilityUnitTypePrice.builder()
                .id(10L).facilityId(1L).unitTypeId(7L).monthlyPrice(4_000_000L).version(0L).build();

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facilityQ1));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitTypeS));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(q1Price));
        when(priceRepository.save(any(FacilityUnitTypePrice.class))).thenAnswer(inv -> inv.getArgument(0));

        // Hôm sau BOM tăng giá lên 5.000.000đ
        FacilityPriceResponse newPriceForCustomerB = pricingService.updatePrice(1L, 7L, new UpdatePriceRequest(5_000_000L));

        assertEquals(5_000_000L, newPriceForCustomerB.getMonthlyPrice(), "Khách B đặt mới áp dụng giá 5tr");
        assertEquals(4_000_000L, existingContractA.getMonthlyPrice(), "Hợp đồng của Khách A vẫn giữ nguyên Snapshot 4tr");
        assertEquals(12_000_000L, existingContractA.getTotalRentalFee());
    }

    @Test
    @DisplayName("CON-01 (Tech Lead Guardrail #2): 2 BOM sửa giá cùng lúc -> phát hiện lệch @Version (0 vs 1) và ném ObjectOptimisticLockingFailureException")
    void shouldThrowOptimisticLockException_whenConcurrentUpdateIncrementsVersion() {
        // Bước 1: BOM 2 đọc đối tượng Price ở thời điểm version = 0, nhưng BOM 1 vừa lưu trước làm DB tăng version lên 1
        FacilityUnitTypePrice dbPriceUpdatedByBom1 = FacilityUnitTypePrice.builder()
                .id(10L)
                .facilityId(1L)
                .unitTypeId(7L)
                .monthlyPrice(4_500_000L)
                .version(1L)
                .build();

        when(facilityRepository.findById(1L)).thenReturn(Optional.of(facilityQ1));
        when(unitTypeRepository.findById(7L)).thenReturn(Optional.of(unitTypeS));
        when(priceRepository.findByFacilityIdAndUnitTypeId(1L, 7L)).thenReturn(Optional.of(dbPriceUpdatedByBom1));

        // Bước 2: BOM 2 gửi request cập nhật giá với version cũ (version = 0)
        UpdatePriceRequest staleRequestFromBom2 = UpdatePriceRequest.builder()
                .monthlyPrice(5_000_000L)
                .version(0L)
                .build();

        // Bước 3: Kỳ vọng ném ObjectOptimisticLockingFailureException và không ghi đè dữ liệu của BOM 1
        assertThrows(ObjectOptimisticLockingFailureException.class,
                () -> pricingService.updatePrice(1L, 7L, staleRequestFromBom2));

        verify(priceRepository, never()).save(any());
        assertEquals(4_500_000L, dbPriceUpdatedByBom1.getMonthlyPrice());
    }
}
