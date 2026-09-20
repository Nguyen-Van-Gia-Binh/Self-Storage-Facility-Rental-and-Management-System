package com.swp391.selfstorage.unit.repository;

import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacilityUnitTypePriceRepository extends JpaRepository<FacilityUnitTypePrice, Long> {

    Optional<FacilityUnitTypePrice> findByFacilityIdAndUnitTypeId(Long facilityId, Long unitTypeId);

    List<FacilityUnitTypePrice> findAllByFacilityId(Long facilityId);

    void deleteByFacilityIdAndUnitTypeId(Long facilityId, Long unitTypeId);
}
