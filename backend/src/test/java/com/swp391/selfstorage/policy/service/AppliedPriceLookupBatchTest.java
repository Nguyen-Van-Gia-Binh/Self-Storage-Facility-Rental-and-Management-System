package com.swp391.selfstorage.policy.service;

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

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppliedPriceLookupBatchTest {

    @Mock
    private FacilityUnitTypePriceVersionRepository versionRepository;

    @Mock
    private FacilityUnitTypePriceRepository priceRepository;

    @Mock
    private UnitTypeRepository unitTypeRepository;

    private AppliedPriceLookup appliedPriceLookup;

    @BeforeEach
    void setUp() {
        appliedPriceLookup = new AppliedPriceLookup(versionRepository, priceRepository, unitTypeRepository);
    }

    @Test
    @DisplayName("Batch resolveLowestMonthlyPricesByFacilityIds: lấy giá thấp nhất theo version/live và lọc unit_type active trong tối đa 3 batch query")
    void shouldResolveLowestMonthlyPricesInBatch() {
        FacilityUnitTypePrice p11 = new FacilityUnitTypePrice();
        p11.setFacilityId(1L);
        p11.setUnitTypeId(10L);
        p11.setMonthlyPrice(1_800_000L);

        FacilityUnitTypePrice p12 = new FacilityUnitTypePrice();
        p12.setFacilityId(1L);
        p12.setUnitTypeId(20L);
        p12.setMonthlyPrice(1_500_000L);

        FacilityUnitTypePrice p21 = new FacilityUnitTypePrice();
        p21.setFacilityId(2L);
        p21.setUnitTypeId(30L);
        p21.setMonthlyPrice(500_000L); // inactive unit type -> must ignore

        FacilityUnitTypePrice p22 = new FacilityUnitTypePrice();
        p22.setFacilityId(2L);
        p22.setUnitTypeId(10L);
        p22.setMonthlyPrice(2_000_000L);

        FacilityUnitTypePriceVersion v11New = new FacilityUnitTypePriceVersion();
        v11New.setFacilityId(1L);
        v11New.setUnitTypeId(10L);
        v11New.setMonthlyPrice(1_200_000L);

        FacilityUnitTypePriceVersion v11Old = new FacilityUnitTypePriceVersion();
        v11Old.setFacilityId(1L);
        v11Old.setUnitTypeId(10L);
        v11Old.setMonthlyPrice(900_000L);

        UnitType ut10 = new UnitType();
        ut10.setId(10L);
        ut10.setActive(true);

        UnitType ut20 = new UnitType();
        ut20.setId(20L);
        ut20.setActive(true);

        UnitType ut30 = new UnitType();
        ut30.setId(30L);
        ut30.setActive(false);

        when(priceRepository.findAllByFacilityIdIn(List.of(1L, 2L)))
                .thenReturn(List.of(p11, p12, p21, p22));
        when(versionRepository.findAppliedByFacilityIdIn(eq(List.of(1L, 2L)), any(LocalDate.class)))
                .thenReturn(List.of(v11New, v11Old));
        when(unitTypeRepository.findAllById(Set.of(10L, 20L, 30L)))
                .thenReturn(List.of(ut10, ut20, ut30));

        Map<Long, Long> result = appliedPriceLookup.resolveLowestMonthlyPricesByFacilityIds(List.of(1L, 2L));

        assertEquals(1_200_000L, result.get(1L));
        assertEquals(2_000_000L, result.get(2L));
        verify(priceRepository, times(1)).findAllByFacilityIdIn(any());
        verify(versionRepository, times(1)).findAppliedByFacilityIdIn(any(), any());
        verify(unitTypeRepository, times(1)).findAllById(any());
        verify(priceRepository, never()).findAllByFacilityId(any());
        verify(unitTypeRepository, never()).findById(any());
    }
}

