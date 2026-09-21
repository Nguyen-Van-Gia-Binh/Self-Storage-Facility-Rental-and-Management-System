package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;

import java.time.LocalDate;

public interface OverdueProcessingService {

    /**
     * Xử lý các hợp đồng quá hạn (Overdue) cho một ngày mốc cụ thể.
     * Áp dụng quy tắc nghiệp vụ BR-OVD-*:
     * - D+1..D+3: Ân hạn (0đ phạt, chuyển sang OVERDUE).
     * - D+4..D+9: Phạt lũy tiến theo ngày (10% tiền cọc/ngày).
     * - D+10+: Chốt trần phạt 70% cọc, cấn trừ cọc, vô hiệu hóa access_code,
     * chuyển hợp đồng sang TERMINATED, chuyển ô kho sang CLEANING.
     *
     * @param runDate Ngày mốc để tính số ngày quá hạn (cho phép truyền linh hoạt
     *                phục vụ test)
     * @return DTO thống kê kết quả quét đợt xử lý
     */
    OverdueProcessingResult processOverdueContracts(LocalDate runDate);
}
