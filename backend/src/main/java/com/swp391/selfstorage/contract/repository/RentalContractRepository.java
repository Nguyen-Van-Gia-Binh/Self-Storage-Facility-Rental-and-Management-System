package com.swp391.selfstorage.contract.repository;

import com.swp391.selfstorage.contract.entity.RentalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalContractRepository extends JpaRepository<RentalContract, Long>, JpaSpecificationExecutor<RentalContract> {
    Optional<RentalContract> findByReservationId(Long reservationId);
    Optional<RentalContract> findByIdAndFacilityIdIn(Long id, List<Long> facilityIds);
    List<RentalContract> findByFacilityId(Long facilityId);
    boolean existsByAccessCode(String accessCode);
}
