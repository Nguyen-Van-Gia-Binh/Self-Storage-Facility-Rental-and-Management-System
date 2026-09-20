package com.swp391.selfstorage.facility.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FacilityEntityTest {

    @Test
    @DisplayName("Tạo thực thể Facility với đầy đủ thông tin")
    void testCreateFacilityEntity() {
        Facility facility = new Facility();
        facility.setCode("FAC-TEST");
        facility.setName("Kho Thử Nghiệm");
        facility.setAddress("123 Đường Thử Nghiệm");
        facility.setPhone("0900000000");
        facility.setDescription("Mô tả thử nghiệm");
        facility.setOpeningHours("08:00–21:00");
        facility.setStatus(FacilityStatus.ACTIVE);

        assertEquals("FAC-TEST", facility.getCode());
        assertEquals("Kho Thử Nghiệm", facility.getName());
        assertEquals("123 Đường Thử Nghiệm", facility.getAddress());
        assertEquals("0900000000", facility.getPhone());
        assertEquals("Mô tả thử nghiệm", facility.getDescription());
        assertEquals("08:00–21:00", facility.getOpeningHours());
        assertEquals(FacilityStatus.ACTIVE, facility.getStatus());
        assertTrue(facility.isActive());
    }
}
