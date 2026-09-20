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
}
