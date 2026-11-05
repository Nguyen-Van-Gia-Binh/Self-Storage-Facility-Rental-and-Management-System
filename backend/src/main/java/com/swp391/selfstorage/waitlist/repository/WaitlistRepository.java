package com.swp391.selfstorage.waitlist.repository;

import com.swp391.selfstorage.waitlist.entity.Waitlist;
import com.swp391.selfstorage.waitlist.entity.WaitlistStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {

    List<Waitlist> findByFacilityIdAndStatusInOrderByCreatedAtAsc(
            Long facilityId, Collection<WaitlistStatus> statuses);

    List<Waitlist> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    boolean existsByCustomerIdAndFacilityIdAndUnitTypeIdAndStatusIn(
            Long customerId, Long facilityId, Long unitTypeId, Collection<WaitlistStatus> statuses);

    /**
     * Guardrail 1 (Tech Lead): Atomic Conditional Update chống Race Condition khi 2 FM bấm Bắt đầu tư vấn cùng lúc.
     * Trả về số dòng cập nhật thành công (1 nếu lấy được lock, 0 nếu bị FM khác tranh chấp).
     */
    @Modifying
    @Query("UPDATE Waitlist w SET w.status = :newStatus, w.assignedFmId = :fmId, w.lastContactedAt = :now, w.contactTimeoutAt = :timeoutAt " +
            "WHERE w.id = :id AND w.status IN (:allowedStatuses)")
    int atomicStartContacting(
            @Param("id") Long id,
            @Param("newStatus") WaitlistStatus newStatus,
            @Param("fmId") Long fmId,
            @Param("now") OffsetDateTime now,
            @Param("timeoutAt") OffsetDateTime timeoutAt,
            @Param("allowedStatuses") Collection<WaitlistStatus> allowedStatuses
    );

    /**
     * Guardrail 1 & 3: Tự động giải phóng các bản ghi CONTACTING quá hạn 2 giờ về WAITING.
     */
    @Modifying
    @Query("UPDATE Waitlist w SET w.status = :waitingStatus, w.assignedFmId = NULL, w.contactTimeoutAt = NULL " +
            "WHERE w.status = :contactingStatus AND w.contactTimeoutAt < :now")
    int unlockExpiredContacting(
            @Param("waitingStatus") WaitlistStatus waitingStatus,
            @Param("contactingStatus") WaitlistStatus contactingStatus,
            @Param("now") OffsetDateTime now
    );

    List<Waitlist> findByConvertedReservationIdIn(Collection<Long> reservationIds);

    /**
     * Guardrail 3 (Tech Lead): Chống mồ côi - Khi Reservation hết hạn cọc 24h, tự động hoàn trả Waitlist về PENDING_FOLLOW_UP.
     */
    @Modifying
    @Query("UPDATE Waitlist w SET w.status = :followUpStatus, " +
            "w.contactNotes = CONCAT(COALESCE(w.contactNotes, ''), ' [Hết hạn cọc 24h: cần liên hệ lại]') " +
            "WHERE w.convertedReservationId IN (:reservationIds) AND w.status = :convertedStatus")
    int revertWaitlistsForExpiredReservations(
            @Param("reservationIds") Collection<Long> reservationIds,
            @Param("followUpStatus") WaitlistStatus followUpStatus,
            @Param("convertedStatus") WaitlistStatus convertedStatus
    );
}
