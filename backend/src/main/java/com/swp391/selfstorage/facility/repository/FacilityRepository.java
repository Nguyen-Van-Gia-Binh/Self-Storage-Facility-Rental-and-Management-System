package com.swp391.selfstorage.facility.repository;

import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    Optional<Facility> findByCode(String code);

    @Query("""
        SELECT f FROM Facility f
        WHERE (:status IS NULL OR f.status = :status)
          AND (:keyword IS NULL OR :keyword = ''
               OR LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(f.address) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(f.code) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<Facility> findByFilter(@Param("keyword") String keyword,
                               @Param("status") FacilityStatus status,
                               Pageable pageable);

    @Query(value = """
        SELECT COUNT(rc.id) FROM rental_contract rc
        WHERE rc.facility_id = :facilityId
          AND rc.status IN ('ACTIVE', 'OVERDUE')
    """, nativeQuery = true)
    long countActiveContractsByFacilityId(@Param("facilityId") Long facilityId);
}
