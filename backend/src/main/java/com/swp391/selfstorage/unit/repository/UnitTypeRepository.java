package com.swp391.selfstorage.unit.repository;

import com.swp391.selfstorage.unit.entity.UnitType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UnitTypeRepository extends JpaRepository<UnitType, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    @Query("""
        SELECT ut FROM UnitType ut
        JOIN FacilityUnitTypePrice futp ON ut.id = futp.unitTypeId
        WHERE futp.facilityId = :facilityId
          AND (:isActive IS NULL OR ut.isActive = :isActive)
    """)
    Page<UnitType> findByFacilityIdAndFilter(
            @Param("facilityId") Long facilityId,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}
