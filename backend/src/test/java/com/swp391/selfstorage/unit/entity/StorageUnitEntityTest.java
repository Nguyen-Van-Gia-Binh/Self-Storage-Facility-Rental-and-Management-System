package com.swp391.selfstorage.unit.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class StorageUnitEntityTest {

    @Test
    @DisplayName("Khởi tạo StorageUnit mặc định trạng thái AVAILABLE")
    void testStorageUnitDefaultStatus() {
        StorageUnit unit = StorageUnit.builder()
                .facilityId(1L)
                .unitTypeId(7L)
                .code("S-101")
                .floor(1)
                .position("A1")
                .status(StorageUnitStatus.AVAILABLE)
                .build();

        assertEquals(StorageUnitStatus.AVAILABLE, unit.getStatus());
        assertTrue(unit.isActive());
    }

    @Test
    @DisplayName("StorageUnit ở trạng thái OUT_OF_SERVICE thì isActive là false")
    void testStorageUnitOutOfService() {
        StorageUnit unit = StorageUnit.builder()
                .facilityId(1L)
                .unitTypeId(7L)
                .code("S-101")
                .status(StorageUnitStatus.OUT_OF_SERVICE)
                .build();

        assertFalse(unit.isActive());
    }
}
