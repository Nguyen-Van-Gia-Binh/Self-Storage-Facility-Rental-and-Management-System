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
