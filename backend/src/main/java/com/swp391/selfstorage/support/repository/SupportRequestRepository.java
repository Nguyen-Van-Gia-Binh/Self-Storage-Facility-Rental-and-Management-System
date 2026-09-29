package com.swp391.selfstorage.support.repository;

import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportRequest;
import com.swp391.selfstorage.support.entity.SupportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupportRequestRepository extends JpaRepository<SupportRequest, Long> {

    Page<SupportRequest> findByCustomerId(Long customerId, Pageable pageable);

    Page<SupportRequest> findByCustomerIdAndStatus(Long customerId, SupportStatus status, Pageable pageable);

    Page<SupportRequest> findByCustomerIdAndCategory(Long customerId, SupportCategory category, Pageable pageable);

    Page<SupportRequest> findByCustomerIdAndStatusAndCategory(
            Long customerId, SupportStatus status, SupportCategory category, Pageable pageable
    );

    Optional<SupportRequest> findByIdAndCustomerId(Long id, Long customerId);

    Optional<SupportRequest> findByCode(String code);

    List<SupportRequest> findByContractIdInAndCategoryAndStatusIn(
            Collection<Long> contractIds, SupportCategory category, Collection<SupportStatus> statuses);

    List<SupportRequest> findByStorageUnitIdInAndCategoryAndStatusIn(
            Collection<Long> storageUnitIds, SupportCategory category, Collection<SupportStatus> statuses);

    long countByCodeStartingWith(String prefix);

    java.util.List<SupportRequest> findByStatus(SupportStatus status);

    long countByAssignedStaffIdAndStatusIn(Long assignedStaffId, java.util.Collection<SupportStatus> statuses);

    long countByAssignedStaffIdAndStatus(Long assignedStaffId, SupportStatus status);

    Page<SupportRequest> findByAssignedStaffId(Long assignedStaffId, Pageable pageable);

    java.util.List<SupportRequest> findAllByAssignedStaffId(Long assignedStaffId);

    @org.springframework.data.jpa.repository.Query(
            "SELECT sr FROM SupportRequest sr " +
            "LEFT JOIN com.swp391.selfstorage.contract.entity.RentalContract rc ON sr.contractId = rc.id " +
            "LEFT JOIN com.swp391.selfstorage.unit.entity.StorageUnit su ON sr.storageUnitId = su.id " +
            "WHERE (rc.facilityId IN :facilityIds OR su.facilityId IN :facilityIds) " +
            "AND (:status IS NULL OR sr.status = :status) " +
            "AND (:category IS NULL OR sr.category = :category) " +
            "AND (:assignedStaffId IS NULL OR sr.assignedStaffId = :assignedStaffId)"
    )
    Page<SupportRequest> findByFacilityIdsAndFilters(
            @org.springframework.data.repository.query.Param("facilityIds") java.util.Collection<Long> facilityIds,
            @org.springframework.data.repository.query.Param("status") SupportStatus status,
            @org.springframework.data.repository.query.Param("category") SupportCategory category,
            @org.springframework.data.repository.query.Param("assignedStaffId") Long assignedStaffId,
            Pageable pageable
    );

    @org.springframework.data.jpa.repository.Query(
            "SELECT sr FROM SupportRequest sr " +
            "LEFT JOIN com.swp391.selfstorage.contract.entity.RentalContract rc ON sr.contractId = rc.id " +
            "LEFT JOIN com.swp391.selfstorage.unit.entity.StorageUnit su ON sr.storageUnitId = su.id " +
            "WHERE (:facilityId IS NULL OR rc.facilityId = :facilityId OR su.facilityId = :facilityId) " +
            "AND (:status IS NULL OR sr.status = :status) " +
            "AND (:category IS NULL OR sr.category = :category) " +
            "AND (:assignedStaffId IS NULL OR sr.assignedStaffId = :assignedStaffId)"
    )
    Page<SupportRequest> findAllManagementRequests(
            @org.springframework.data.repository.query.Param("facilityId") Long facilityId,
            @org.springframework.data.repository.query.Param("status") SupportStatus status,
            @org.springframework.data.repository.query.Param("category") SupportCategory category,
            @org.springframework.data.repository.query.Param("assignedStaffId") Long assignedStaffId,
            Pageable pageable
    );
}
