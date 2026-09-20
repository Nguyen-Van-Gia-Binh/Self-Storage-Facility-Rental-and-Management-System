package com.swp391.selfstorage.reservation.repository;

import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
