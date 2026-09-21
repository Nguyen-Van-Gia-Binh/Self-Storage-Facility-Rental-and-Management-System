package com.swp391.selfstorage.user.repository;

import com.swp391.selfstorage.user.entity.UserFacilityAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFacilityAssignmentRepository extends JpaRepository<UserFacilityAssignment, Long> {

    List<UserFacilityAssignment> findByUserId(Long userId);

    @Query("SELECT ufa.facilityId FROM UserFacilityAssignment ufa WHERE ufa.userId = :userId")
    List<Long> findFacilityIdsByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndFacilityId(Long userId, Long facilityId);

    @Modifying
    @Query("DELETE FROM UserFacilityAssignment ufa WHERE ufa.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
