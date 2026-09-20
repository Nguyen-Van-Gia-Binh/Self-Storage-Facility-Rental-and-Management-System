package com.swp391.selfstorage.facility.repository;

import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class FacilityRepositoryTest {

    @Autowired
    private FacilityRepository facilityRepository;

    @Test
    @DisplayName("Kiểm tra tồn tại của mã cơ sở")
    void testExistsByCode() {
        assertTrue(facilityRepository.existsByCode("FAC-CG"));
        assertFalse(facilityRepository.existsByCode("FAC-NON-EXISTENT"));
    }

    @Test
    @DisplayName("Tìm kiếm cơ sở theo từ khóa và trạng thái")
    void testFindByFilter() {
        Page<Facility> result = facilityRepository.findByFilter("Cầu Giấy", FacilityStatus.ACTIVE, PageRequest.of(0, 10));
        assertFalse(result.isEmpty());
        assertEquals("FAC-CG", result.getContent().get(0).getCode());
    }
}
