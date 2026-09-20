package com.swp391.selfstorage.unit.repository;

import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE)
class UnitRepositoryTest {

    @Autowired
    private UnitTypeRepository unitTypeRepository;

    @Autowired
    private FacilityUnitTypePriceRepository priceRepository;

    @Autowired
    private StorageUnitRepository storageUnitRepository;

    @Test
    @DisplayName("Lưu và tìm kiếm UnitType, FacilityUnitTypePrice, StorageUnit thành công")
    void testUnitCrudAndQueries() {
        UnitType ut = unitTypeRepository.save(UnitType.builder()
                .code("UT-TEST")
                .name("Kho Test")
                .widthM(new BigDecimal("2.0"))
                .lengthM(new BigDecimal("2.0"))
                .heightM(new BigDecimal("2.5"))
                .isActive(true)
                .build());

        priceRepository.save(FacilityUnitTypePrice.builder()
                .facilityId(1L)
                .unitTypeId(ut.getId())
                .monthlyPrice(1500000L)
                .build());

        StorageUnit unit = storageUnitRepository.save(StorageUnit.builder()
                .facilityId(1L)
                .unitTypeId(ut.getId())
                .code("U-101")
                .floor(1)
                .position("Dãy A")
                .status(StorageUnitStatus.AVAILABLE)
                .build());

        assertTrue(unitTypeRepository.existsByCode("UT-TEST"));
        assertTrue(storageUnitRepository.existsByFacilityIdAndCode(1L, "U-101"));

        Page<StorageUnit> unitsPage = storageUnitRepository.findByFacilityIdAndFilters(
                1L, ut.getId(), StorageUnitStatus.AVAILABLE, PageRequest.of(0, 10));
        assertEquals(1, unitsPage.getTotalElements());

        long activeCount = storageUnitRepository.countByUnitTypeIdAndStatusIn(
                ut.getId(), List.of(StorageUnitStatus.RESERVED, StorageUnitStatus.OCCUPIED));
        assertEquals(0, activeCount);
    }
}
