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

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Reservation r " +
           "WHERE r.customerId = :customerId " +
           "  AND r.status = :status " +
           "  AND r.holdExpiresAt > :now")
    boolean existsActivePendingByCustomerId(
            @Param("customerId") Long customerId,
            @Param("status") ReservationStatus status,
            @Param("now") OffsetDateTime now
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reservation r WHERE r.id = :id")
    Optional<Reservation> findByIdWithLock(@Param("id") Long id);

    Optional<Reservation> findByCodeAndFacilityId(String code, Long facilityId);

    /**
     * Reservation còn hiệu lực trên đúng ô kho, nới ngày kết thúc thêm rental.buffer_days.
     * FULFILLED không tính: Contract kế thừa đã chiếm slot (BR-AVL-01, BR-AVL-02).
     */
    @Query(value = "SELECT CASE WHEN EXISTS (" +
           "SELECT 1 FROM reservation r " +
           "WHERE r.storage_unit_id = :storageUnitId " +
           "  AND ((r.status = 'PENDING_PAYMENT' AND r.hold_expires_at > :now) OR r.status = 'CONFIRMED') " +
           "  AND r.start_date < :endDateExclusive " +
           "  AND DATEADD(DAY, :bufferDays, r.end_date_exclusive) > :startDate" +
           ") THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END", nativeQuery = true)
    boolean existsOverlappingReservationForUnit(
            @Param("storageUnitId") Long storageUnitId,
            @Param("startDate") java.time.LocalDate startDate,
            @Param("endDateExclusive") java.time.LocalDate endDateExclusive,
            @Param("now") OffsetDateTime now,
            @Param("bufferDays") int bufferDays
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
