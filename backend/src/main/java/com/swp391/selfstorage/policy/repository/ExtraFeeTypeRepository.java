package com.swp391.selfstorage.policy.repository;

import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
