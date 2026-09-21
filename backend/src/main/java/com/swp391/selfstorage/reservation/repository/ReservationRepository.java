package com.swp391.selfstorage.reservation.repository;

import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    Optional<Reservation> findByCode(String code);

    List<Reservation> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Reservation> findByStatusAndHoldExpiresAtBefore(ReservationStatus status, OffsetDateTime now);

    boolean existsByStorageUnitIdAndStatusIn(Long storageUnitId, Collection<ReservationStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reservation r WHERE r.id = :id")
    Optional<Reservation> findByIdWithLock(@Param("id") Long id);

    Optional<Reservation> findByCodeAndFacilityId(String code, Long facilityId);

    @Query("SELECT COUNT(r) > 0 FROM Reservation r " +
           "WHERE r.storageUnitId = :storageUnitId " +
           "  AND ( " +
           "       (r.status = 'PENDING_PAYMENT' AND r.holdExpiresAt > :now) " +
           "       OR (r.status IN ('CONFIRMED', 'FULFILLED')) " +
           "  ) " +
           "  AND r.startDate < :endDateExclusive " +
           "  AND r.endDateExclusive > :startDate")
    boolean existsOverlappingReservationForUnit(
            @Param("storageUnitId") Long storageUnitId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDateExclusive") java.time.LocalDate endDateExclusive,
            @Param("now") OffsetDateTime now
    );

    @Query("SELECT r FROM Reservation r WHERE " +
           "(:customerId IS NULL OR r.customerId = :customerId) AND " +
           "(:facilityId IS NULL OR r.facilityId = :facilityId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:startDateFrom IS NULL OR r.startDate >= :startDateFrom) AND " +
           "(:startDateTo IS NULL OR r.startDate <= :startDateTo)")
    org.springframework.data.domain.Page<Reservation> findWithFilters(
            @Param("customerId") Long customerId,
            @Param("facilityId") Long facilityId,
            @Param("status") ReservationStatus status,
            @Param("startDateFrom") java.time.LocalDate startDateFrom,
            @Param("startDateTo") java.time.LocalDate startDateTo,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("SELECT r FROM Reservation r WHERE " +
           "r.facilityId IN :facilityIds AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:startDateFrom IS NULL OR r.startDate >= :startDateFrom) AND " +
           "(:startDateTo IS NULL OR r.startDate <= :startDateTo)")
    org.springframework.data.domain.Page<Reservation> findByFacilityIdsWithFilters(
            @Param("facilityIds") Collection<Long> facilityIds,
            @Param("status") ReservationStatus status,
            @Param("startDateFrom") java.time.LocalDate startDateFrom,
            @Param("startDateTo") java.time.LocalDate startDateTo,
            org.springframework.data.domain.Pageable pageable
    );

    @Query(value = "SELECT r.* FROM reservation r " +
            "JOIN app_user u ON u.id = r.customer_id " +
            "WHERE (u.phone = :query OR u.identity_number = :query) " +
            "  AND r.facility_id = :facilityId " +
            "  AND r.status IN ('CONFIRMED','PENDING_PAYMENT') " +
            "ORDER BY r.created_at DESC",
            nativeQuery = true)
    List<Reservation> findByCustomerContactAndFacility(
            @Param("query") String query,
            @Param("facilityId") Long facilityId);
}
