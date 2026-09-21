package com.swp391.selfstorage.support.repository;

import com.swp391.selfstorage.support.entity.AssignmentTaskType;
import com.swp391.selfstorage.support.entity.StaffDailyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffDailyAssignmentRepository extends JpaRepository<StaffDailyAssignment, Long> {

    List<StaffDailyAssignment> findByStaffIdAndWorkDate(Long staffId, LocalDate workDate);

    List<StaffDailyAssignment> findByFacilityIdAndWorkDate(Long facilityId, LocalDate workDate);

    long countByStaffIdAndWorkDate(Long staffId, LocalDate workDate);

    long countByStaffIdAndTaskType(Long staffId, AssignmentTaskType taskType);

    Optional<StaffDailyAssignment> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);

    List<StaffDailyAssignment> findAllByReferenceTypeAndReferenceId(String referenceType, Long referenceId);
}
