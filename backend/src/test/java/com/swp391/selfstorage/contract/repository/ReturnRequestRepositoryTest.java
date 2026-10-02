package com.swp391.selfstorage.contract.repository;

import com.swp391.selfstorage.contract.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class ReturnRequestRepositoryTest {

    @Autowired private RentalContractRepository rentalContractRepository;
    @Autowired private ReturnRequestRepository returnRequestRepository;

    @Test
    @DisplayName("Lưu và tìm kiếm ReturnRequest theo contractId và status")
    void testSaveAndFindByContractId() {
        RentalContract contract = rentalContractRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Không có hợp đồng mẫu để test"));

        returnRequestRepository.deleteAll(returnRequestRepository.findByContractIdOrderByCreatedAtDesc(contract.getId()));

        ReturnRequest request = ReturnRequest.builder()
                .contractId(contract.getId())
                .requestedReturnDate(LocalDate.now().plusDays(3))
                .status(ReturnRequestStatus.PENDING)
                .build();
        ReturnRequest saved = returnRequestRepository.save(request);

        assertNotNull(saved.getId());
        Optional<ReturnRequest> found = returnRequestRepository.findByContractIdAndStatus(contract.getId(), ReturnRequestStatus.PENDING);
        assertTrue(found.isPresent());
        assertEquals(contract.getId(), found.get().getContractId());
    }
}
