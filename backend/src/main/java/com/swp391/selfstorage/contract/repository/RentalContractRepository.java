package com.swp391.selfstorage.contract.repository;

import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RentalContractRepository
        extends JpaRepository<RentalContract, Long>, JpaSpecificationExecutor<RentalContract> {
    Optional<RentalContract> findByReservationId(Long reservationId);

    Optional<RentalContract> findByIdAndFacilityIdIn(Long id, List<Long> facilityIds);

    List<RentalContract> findByFacilityId(Long facilityId);

    boolean existsByAccessCode(String accessCode);

    boolean existsByCustomerIdAndStatus(Long customerId, ContractStatus status);

    Page<RentalContract> findByCustomerId(Long customerId, Pageable pageable);

    Page<RentalContract> findByCustomerIdAndStatus(Long customerId, ContractStatus status, Pageable pageable);

    Page<RentalContract> findByCustomerIdAndStatusIn(Long customerId, List<ContractStatus> statuses, Pageable pageable);

    Optional<RentalContract> findByIdAndCustomerId(Long id, Long customerId);

    /**
     * Tìm tất cả hợp đồng có trạng thái nằm trong danh sách và ngày kết thúc <=
     * ngày chỉ định.
     * Dùng cho Cronjob quét quá hạn (T4.6).
     */
    List<RentalContract> findByStatusInAndEndDateExclusiveLessThanEqual(List<ContractStatus> statuses, LocalDate date);
}
