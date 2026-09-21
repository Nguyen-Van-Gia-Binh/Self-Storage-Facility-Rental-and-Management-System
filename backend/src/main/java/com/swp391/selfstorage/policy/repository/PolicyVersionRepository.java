package com.swp391.selfstorage.policy.repository;

import java.time.OffsetDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.swp391.selfstorage.policy.entity.PolicyVersion;

@Repository
public interface PolicyVersionRepository extends JpaRepository<PolicyVersion, Long> {

    /**
     * Tìm phiên bản chính sách đang có hiệu lực tại thời điểm hiện tại.
     */
    Optional<PolicyVersion> findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(OffsetDateTime now);

    /**
     * Tìm phiên bản theo số version_no duy nhất.
     */
    Optional<PolicyVersion> findByVersionNo(Integer versionNo);

    /**
     * Kiểm tra số version_no đã tồn tại hay chưa.
     */
    boolean existsByVersionNo(Integer versionNo);

    /**
     * Lấy phiên bản có số version_no lớn nhất để tự động tăng version.
     */
    Optional<PolicyVersion> findTopByOrderByVersionNoDesc();
}
