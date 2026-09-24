package com.swp391.selfstorage.unit;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.unit.dto.StorageUnitResponse;
import com.swp391.selfstorage.unit.dto.UnitTypeResponse;
import com.swp391.selfstorage.unit.service.StorageUnitService;
import com.swp391.selfstorage.unit.service.UnitTypeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UnitTypeIntegrationTest {

    @Autowired
    private UnitTypeService unitTypeService;

    @Autowired
    private StorageUnitService storageUnitService;

    @Test
    @DisplayName("Test gọi Service lấy UnitTypes và StorageUnits cơ sở 1 và 8")
    void testUnitServices() {
        try {
            PageResponse<UnitTypeResponse> ut1 = unitTypeService.getUnitTypesByFacility(1L, null, PageRequest.of(0, 10));
            assertNotNull(ut1);
            System.out.println("Facility 1 UnitTypes: " + ut1.getContent().size());

            PageResponse<StorageUnitResponse> su1 = storageUnitService.getStorageUnitsByFacility(1L, null, null, PageRequest.of(0, 10));
            assertNotNull(su1);
            System.out.println("Facility 1 StorageUnits: " + su1.getContent().size());

            PageResponse<UnitTypeResponse> ut8 = unitTypeService.getUnitTypesByFacility(8L, null, PageRequest.of(0, 10));
            assertNotNull(ut8);
            System.out.println("Facility 8 UnitTypes: " + ut8.getContent().size());

            PageResponse<StorageUnitResponse> su8 = storageUnitService.getStorageUnitsByFacility(8L, null, null, PageRequest.of(0, 10));
            assertNotNull(su8);
            System.out.println("Facility 8 StorageUnits: " + su8.getContent().size());
        } catch (Exception e) {
            e.printStackTrace();
            fail("Exception thrown: " + e.getMessage());
        }
    }
}
