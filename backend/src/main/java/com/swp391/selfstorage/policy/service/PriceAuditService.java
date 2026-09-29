package com.swp391.selfstorage.policy.service;

import java.time.LocalDate;

import com.swp391.selfstorage.policy.dto.PriceAuditPageResponse;

public interface PriceAuditService {

    /**
     * Mọi phiên bản giá thuê, phụ phí và chính sách, mới nhất trước.
     * Chính sách là toàn hệ thống nên vẫn xuất hiện khi lọc theo cơ sở.
     */
    PriceAuditPageResponse search(
            String category,
            Long facilityId,
            LocalDate from,
            LocalDate to,
            Long actorId,
            int page,
            int size);
}
