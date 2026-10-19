package com.swp391.selfstorage.policy.repository;

import com.swp391.selfstorage.policy.entity.DiscountProgram;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DiscountProgramRepository extends JpaRepository<DiscountProgram, Long> {

    @Query("SELECT d FROM DiscountProgram d WHERE d.isActive = true " +
           "AND d.startDate <= :date AND d.endDate >= :date " +
           "AND d.minRentalMonths <= :months " +
           "AND (d.scopeType = 'SYSTEM' " +
           "     OR (d.scopeType = 'FACILITY' AND d.facilityId = :facilityId) " +
           "     OR (d.scopeType = 'UNIT_TYPE' AND d.unitTypeId = :unitTypeId))")
    List<DiscountProgram> findApplicablePrograms(
            @Param("date") LocalDate date,
            @Param("months") int months,
            @Param("facilityId") Long facilityId,
            @Param("unitTypeId") Long unitTypeId
    );

    Page<DiscountProgram> findByIsActive(Boolean isActive, Pageable pageable);
}
