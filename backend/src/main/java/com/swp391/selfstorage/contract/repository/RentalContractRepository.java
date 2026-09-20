package com.swp391.selfstorage.contract.repository;

import com.swp391.selfstorage.contract.entity.RentalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {
    boolean existsByAccessCode(String accessCode);
    Optional<RentalContract> findByReservationId(Long reservationId);
    Optional<RentalContract> findByIdAndFacilityIdIn(Long id, Collection<Long> facilityIds);
}
