package com.swp391.selfstorage.policy.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.swp391.selfstorage.policy.entity.ExtraFeeType;

public interface ExtraFeeTypeRepository extends JpaRepository<ExtraFeeType, Long> {

    /**
     * Kiểm tra mã phụ phí đã tồn tại hay chưa (dùng khi validate tạo mới)
     */
    boolean existsByCode(String code);

    /**
     * Tìm phụ phí theo mã định danh duy nhất (dùng khi tra cứu dịch vụ)
     */
    Optional<ExtraFeeType> findByCode(String code);

    /**
     * Lọc danh sách phụ phí theo trạng thái hoạt động có phân trang
     */
    Page<ExtraFeeType> findByIsActive(Boolean isActive, Pageable pageable);

    @Query("""
            SELECT e FROM ExtraFeeType e
            WHERE e.isActive = true
              AND (e.facilityId IS NULL OR e.facilityId = :facilityId)
              AND (e.effectiveFrom IS NULL OR e.effectiveFrom <= :today)
            """)
    List<ExtraFeeType> findApplicable(@Param("facilityId") Long facilityId, @Param("today") LocalDate today);
}
