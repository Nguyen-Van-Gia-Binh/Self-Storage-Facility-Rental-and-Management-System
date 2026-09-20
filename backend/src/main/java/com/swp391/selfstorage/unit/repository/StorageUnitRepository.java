package com.swp391.selfstorage.unit.repository;

import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface StorageUnitRepository extends JpaRepository<StorageUnit, Long> {

    boolean existsByFacilityIdAndCode(Long facilityId, String code);

    boolean existsByFacilityIdAndCodeAndIdNot(Long facilityId, String code, Long id);

    Optional<StorageUnit> findByIdAndFacilityId(Long id, Long facilityId);

    long countByFacilityIdAndUnitTypeId(Long facilityId, Long unitTypeId);

    long countByUnitTypeIdAndStatusIn(Long unitTypeId, Collection<StorageUnitStatus> statuses);

    @Query("""
        SELECT su FROM StorageUnit su
        WHERE su.facilityId = :facilityId
          AND (:unitTypeId IS NULL OR su.unitTypeId = :unitTypeId)
          AND (:status IS NULL OR su.status = :status)
    """)
    Page<StorageUnit> findByFacilityIdAndFilters(
            @Param("facilityId") Long facilityId,
            @Param("unitTypeId") Long unitTypeId,
            @Param("status") StorageUnitStatus status,
            Pageable pageable
    );

    @Query("SELECT COUNT(u) FROM StorageUnit u WHERE u.facilityId = :facilityId AND u.unitTypeId = :unitTypeId AND u.status NOT IN :excludedStatuses")
    long countExploitableUnits(
            @Param("facilityId") Long facilityId,
            @Param("unitTypeId") Long unitTypeId,
            @Param("excludedStatuses") Collection<StorageUnitStatus> excludedStatuses
    );

    @Query(value = "SELECT COUNT(*) FROM reservation r " +
            "WHERE r.facility_id = :facilityId " +
            "  AND r.unit_type_id = :unitTypeId " +
            "  AND (r.status = 'CONFIRMED' OR (r.status = 'PENDING_PAYMENT' AND r.hold_expires_at > SYSDATETIMEOFFSET())) " +
            "  AND r.start_date < :endDateExclusive " +
            "  AND r.end_date_exclusive > :startDate", nativeQuery = true)
    long countOverlappingReservations(
            @Param("facilityId") Long facilityId,
            @Param("unitTypeId") Long unitTypeId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDateExclusive") java.time.LocalDate endDateExclusive
    );

    @Query(value = "SELECT COUNT(*) FROM rental_contract c " +
            "JOIN storage_unit u ON c.storage_unit_id = u.id " +
            "WHERE c.facility_id = :facilityId " +
            "  AND u.unit_type_id = :unitTypeId " +
            "  AND c.status IN ('PENDING_CHECK_IN', 'ACTIVE', 'PENDING_RETURN', 'OVERDUE') " +
            "  AND c.start_date < :endDateExclusive " +
            "  AND c.end_date > :startDate", nativeQuery = true)
    long countOverlappingContracts(
            @Param("facilityId") Long facilityId,
            @Param("unitTypeId") Long unitTypeId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDateExclusive") java.time.LocalDate endDateExclusive
    );
}
