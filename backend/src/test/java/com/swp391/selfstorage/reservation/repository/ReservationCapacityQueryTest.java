package com.swp391.selfstorage.reservation.repository;

import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ReservationCapacityQueryTest {

    @Autowired
    private StorageUnitRepository storageUnitRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Test
    void nativeCapacitySqlRunsOnPostgres() {
        List<Long> locked = storageUnitRepository.lockExploitableUnitIds(1L, 1L);
        long busy = storageUnitRepository.countBusyUnits(
                1L, 1L, LocalDate.now(), LocalDate.now().plusMonths(1), 15);
        long unassigned = reservationRepository.countUnassignedOverlappingReservations(
                1L, 1L, LocalDate.now(), LocalDate.now().plusMonths(1), OffsetDateTime.now(), 15);

        assertNotNull(locked);
        assertTrue(busy >= 0);
        assertTrue(unassigned >= 0);
    }
}
