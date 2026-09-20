package com.swp391.selfstorage.unit.mapper;

import com.swp391.selfstorage.unit.dto.StorageUnitResponse;
import com.swp391.selfstorage.unit.dto.UnitTypeResponse;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class UnitMapperTest {

    private final UnitMapper mapper = new UnitMapper();

    @Test
    @DisplayName("Ánh xạ UnitType sang UnitTypeResponse đầy đủ diện tích, giá và số ô kho")
    void testToUnitTypeResponse() {
        UnitType ut = UnitType.builder()
                .id(7L)
                .code("UT-S")
                .name("Loại S — 3m²")
                .description("Phù hợp đồ cá nhân")
                .widthM(new BigDecimal("1.50"))
                .lengthM(new BigDecimal("2.00"))
                .heightM(new BigDecimal("2.50"))
                .isActive(true)
                .build();

        UnitTypeResponse res = mapper.toUnitTypeResponse(ut, 1L, 800000L, 10L);

        assertEquals(7L, res.getId());
        assertEquals(1L, res.getFacilityId());
        assertEquals("Loại S — 3m²", res.getName());
        assertEquals(new BigDecimal("1.50"), res.getWidthM());
        assertEquals(new BigDecimal("2.00"), res.getDepthM());
        assertEquals(new BigDecimal("2.50"), res.getHeightM());
        assertEquals(new BigDecimal("3.00"), res.getAreaM2());
        assertEquals(800000L, res.getMonthlyPrice());
        assertEquals(10L, res.getTotalUnits());
        assertTrue(res.isActive());
    }

    @Test
    @DisplayName("Ánh xạ StorageUnit sang StorageUnitResponse")
    void testToStorageUnitResponse() {
        StorageUnit su = StorageUnit.builder()
                .id(42L)
                .facilityId(1L)
                .unitTypeId(7L)
                .code("S-101")
                .floor(1)
                .position("A1")
                .status(StorageUnitStatus.AVAILABLE)
                .build();

        StorageUnitResponse res = mapper.toStorageUnitResponse(su, "Loại S — 3m²");

        assertEquals(42L, res.getId());
        assertEquals(1L, res.getFacilityId());
        assertEquals(7L, res.getUnitTypeId());
        assertEquals("Loại S — 3m²", res.getUnitTypeName());
        assertEquals("S-101", res.getCode());
        assertEquals(1, res.getFloor());
        assertEquals("A1", res.getPosition());
        assertEquals(StorageUnitStatus.AVAILABLE, res.getStatus());
        assertTrue(res.isActive());
    }
}
