package com.swp391.selfstorage.facility.mapper;

import com.swp391.selfstorage.facility.dto.CreateFacilityRequest;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FacilityMapperTest {

    private final FacilityMapper mapper = new FacilityMapper();

    @Test
    @DisplayName("Chuyển đổi từ CreateFacilityRequest sang Facility Entity")
    void testToEntity() {
        CreateFacilityRequest req = new CreateFacilityRequest();
        req.setCode("FAC-HN");
        req.setName("Kho Hà Nội");
        req.setAddress("123 Phố Huế");
        req.setPhone("024-1234-5678");
        req.setDescription("Kho trung tâm");
        req.setOpeningHours("07:00–22:00");

        Facility facility = mapper.toEntity(req);

        assertEquals("FAC-HN", facility.getCode());
        assertEquals("Kho Hà Nội", facility.getName());
        assertEquals("123 Phố Huế", facility.getAddress());
        assertEquals(FacilityStatus.ACTIVE, facility.getStatus());
    }

    @Test
    @DisplayName("Chuyển đổi từ Facility Entity sang FacilityResponse")
    void testToResponse() {
        Facility facility = new Facility();
        facility.setId(10L);
        facility.setCode("FAC-HN");
        facility.setName("Kho Hà Nội");
        facility.setAddress("123 Phố Huế");
        facility.setStatus(FacilityStatus.ACTIVE);

        FacilityResponse response = mapper.toResponse(facility);

        assertEquals(10L, response.getId());
        assertEquals("FAC-HN", response.getCode());
        assertEquals("Kho Hà Nội", response.getName());
        assertTrue(response.isActive());
    }
}
