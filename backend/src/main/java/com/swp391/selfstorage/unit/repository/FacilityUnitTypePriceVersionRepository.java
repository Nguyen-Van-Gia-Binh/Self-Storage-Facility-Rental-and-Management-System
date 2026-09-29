package com.swp391.selfstorage.unit.repository;

import com.swp391.selfstorage.unit.entity.FacilityUnitTypePriceVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FacilityUnitTypePriceVersionRepository extends JpaRepository<FacilityUnitTypePriceVersion, Long> {

    List<FacilityUnitTypePriceVersion> findByFacilityIdOrderByEffectiveFromDescCreatedAtDesc(Long facilityId);

    List<FacilityUnitTypePriceVersion> findByFacilityIdAndUnitTypeIdOrderByEffectiveFromDescCreatedAtDesc(
            Long facilityId, Long unitTypeId);

    @Query("""
            SELECT v FROM FacilityUnitTypePriceVersion v
            WHERE v.facilityId = :facilityId AND v.unitTypeId = :unitTypeId
              AND v.effectiveFrom <= :asOf
            ORDER BY v.effectiveFrom DESC, v.id DESC
            """)
    List<FacilityUnitTypePriceVersion> findAppliedCandidates(
            @Param("facilityId") Long facilityId,
            @Param("unitTypeId") Long unitTypeId,
            @Param("asOf") LocalDate asOf);

    default Optional<FacilityUnitTypePriceVersion> findApplied(
            Long facilityId, Long unitTypeId, LocalDate asOf) {
        List<FacilityUnitTypePriceVersion> list = findAppliedCandidates(facilityId, unitTypeId, asOf);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Query("""
            SELECT v FROM FacilityUnitTypePriceVersion v
            WHERE v.facilityId = :facilityId AND v.unitTypeId = :unitTypeId
              AND v.effectiveFrom > :asOf
            ORDER BY v.effectiveFrom ASC, v.id ASC
            """)
    List<FacilityUnitTypePriceVersion> findScheduledCandidates(
            @Param("facilityId") Long facilityId,
            @Param("unitTypeId") Long unitTypeId,
            @Param("asOf") LocalDate asOf);

    default Optional<FacilityUnitTypePriceVersion> findNextScheduled(
            Long facilityId, Long unitTypeId, LocalDate asOf) {
        List<FacilityUnitTypePriceVersion> list = findScheduledCandidates(facilityId, unitTypeId, asOf);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    boolean existsByFacilityIdAndUnitTypeId(Long facilityId, Long unitTypeId);
}
