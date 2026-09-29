package com.swp391.selfstorage.unit.repository;

import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface StorageUnitRepository extends JpaRepository<StorageUnit, Long> {

        boolean existsByFacilityIdAndCode(Long facilityId, String code);

        boolean existsByFacilityIdAndCodeAndIdNot(Long facilityId, String code, Long id);

        Optional<StorageUnit> findByIdAndFacilityId(Long id, Long facilityId);

        List<StorageUnit> findByFacilityId(Long facilityId);

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
                        Pageable pageable);

        @Query("""
                            SELECT su FROM StorageUnit su
                            WHERE su.facilityId = :facilityId
                              AND (:unitTypeId IS NULL OR su.unitTypeId = :unitTypeId)
                              AND (:status IS NULL OR su.status = :status)
                              AND (:floor IS NULL OR su.floor = :floor)
                              AND (:position IS NULL OR su.position = :position)
                        """)
        Page<StorageUnit> findByFacilityIdAndAdvancedFilters(
                        @Param("facilityId") Long facilityId,
                        @Param("unitTypeId") Long unitTypeId,
                        @Param("status") StorageUnitStatus status,
                        @Param("floor") Integer floor,
                        @Param("position") String position,
                        Pageable pageable);

        @Query("SELECT COUNT(u) FROM StorageUnit u WHERE u.facilityId = :facilityId AND u.unitTypeId = :unitTypeId AND u.status NOT IN :excludedStatuses")
        long countExploitableUnits(
                        @Param("facilityId") Long facilityId,
                        @Param("unitTypeId") Long unitTypeId,
                        @Param("excludedStatuses") Collection<StorageUnitStatus> excludedStatuses);

        @Query(value = "SELECT COUNT(*) FROM reservation r " +
                        "WHERE r.facility_id = :facilityId " +
                        "  AND r.unit_type_id = :unitTypeId " +
                        "  AND (r.status = 'CONFIRMED' OR (r.status = 'PENDING_PAYMENT' AND r.hold_expires_at > SYSDATETIMEOFFSET())) "
                        +
                        "  AND r.start_date < :endDateExclusive " +
                        "  AND DATEADD(DAY, :bufferDays, r.end_date_exclusive) > :startDate", nativeQuery = true)
        long countOverlappingReservations(
                        @Param("facilityId") Long facilityId,
                        @Param("unitTypeId") Long unitTypeId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDateExclusive") java.time.LocalDate endDateExclusive,
                        @Param("bufferDays") int bufferDays);

        @Query(value = "SELECT COUNT(*) FROM rental_contract c " +
                        "JOIN storage_unit u ON c.storage_unit_id = u.id " +
                        "WHERE c.facility_id = :facilityId " +
                        "  AND u.unit_type_id = :unitTypeId " +
                        "  AND c.status IN ('PENDING_CHECK_IN', 'ACTIVE', 'PENDING_RETURN', 'OVERDUE') " +
                        "  AND c.start_date < :endDateExclusive " +
                        "  AND DATEADD(DAY, :bufferDays, c.end_date) > :startDate", nativeQuery = true)
        long countOverlappingContracts(
                        @Param("facilityId") Long facilityId,
                        @Param("unitTypeId") Long unitTypeId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDateExclusive") java.time.LocalDate endDateExclusive,
                        @Param("bufferDays") int bufferDays);

        /**
         * Số ô khai thác được đang bận, mỗi ô tính một lần dù vừa có Reservation vừa có Contract (BR-AVL-01, BR-AVL-02).
         */
        @Query(value = "SELECT COUNT(DISTINCT u.id) FROM storage_unit u " +
                        "WHERE u.facility_id = :facilityId " +
                        "  AND u.unit_type_id = :unitTypeId " +
                        "  AND u.status NOT IN ('MAINTENANCE', 'OUT_OF_SERVICE') " +
                        "  AND (" +
                        "    EXISTS (SELECT 1 FROM reservation r " +
                        "            WHERE r.storage_unit_id = u.id " +
                        "              AND (r.status = 'CONFIRMED' OR (r.status = 'PENDING_PAYMENT' AND r.hold_expires_at > SYSDATETIMEOFFSET())) " +
                        "              AND r.start_date < :endDateExclusive " +
                        "              AND DATEADD(DAY, :bufferDays, r.end_date_exclusive) > :startDate) " +
                        "    OR EXISTS (SELECT 1 FROM rental_contract c " +
                        "            WHERE c.storage_unit_id = u.id " +
                        "              AND c.status IN ('PENDING_CHECK_IN', 'ACTIVE', 'PENDING_RETURN', 'OVERDUE') " +
                        "              AND c.start_date < :endDateExclusive " +
                        "              AND DATEADD(DAY, :bufferDays, c.end_date) > :startDate)" +
                        "  )", nativeQuery = true)
        long countBusyUnits(
                        @Param("facilityId") Long facilityId,
                        @Param("unitTypeId") Long unitTypeId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDateExclusive") java.time.LocalDate endDateExclusive,
                        @Param("bufferDays") int bufferDays);

        @Query(value = "SELECT DISTINCT c.storage_unit_id FROM rental_contract c " +
                        "WHERE c.facility_id = :facilityId " +
                        "  AND c.storage_unit_id IS NOT NULL " +
                        "  AND c.status IN ('PENDING_CHECK_IN', 'ACTIVE', 'PENDING_RETURN', 'OVERDUE') " +
                        "  AND c.start_date < :endDateExclusive " +
                        "  AND DATEADD(DAY, :bufferDays, c.end_date) > :startDate", nativeQuery = true)
        List<Long> findOccupiedUnitIdsByDateRange(
                        @Param("facilityId") Long facilityId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDateExclusive") java.time.LocalDate endDateExclusive,
                        @Param("bufferDays") int bufferDays);

        @Query(value = "SELECT DISTINCT r.storage_unit_id FROM reservation r " +
                        "WHERE r.facility_id = :facilityId " +
                        "  AND r.storage_unit_id IS NOT NULL " +
                        "  AND (r.status = 'CONFIRMED' OR (r.status = 'PENDING_PAYMENT' AND r.hold_expires_at > SYSDATETIMEOFFSET())) " +
                        "  AND r.start_date < :endDateExclusive " +
                        "  AND DATEADD(DAY, :bufferDays, r.end_date_exclusive) > :startDate", nativeQuery = true)
        List<Long> findReservedUnitIdsByDateRange(
                        @Param("facilityId") Long facilityId,
                        @Param("startDate") java.time.LocalDate startDate,
                        @Param("endDateExclusive") java.time.LocalDate endDateExclusive,
                        @Param("bufferDays") int bufferDays);

        /**
         * Pessimistic Write Lock ngan race condition khi confirm payment — BR-AVL-04.
         * SQL Server dich sang WITH (UPDLOCK, ROWLOCK).
         */
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT u FROM StorageUnit u WHERE u.id = :id")
        Optional<StorageUnit> findByIdForUpdate(@Param("id") Long id);
}
