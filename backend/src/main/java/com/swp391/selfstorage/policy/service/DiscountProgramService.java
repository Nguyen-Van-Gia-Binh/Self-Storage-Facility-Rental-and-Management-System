package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.policy.dto.CreateDiscountProgramRequest;
import com.swp391.selfstorage.policy.dto.DiscountProgramResponse;
import com.swp391.selfstorage.policy.dto.UpdateDiscountProgramRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface DiscountProgramService {

    record BestDiscountResult(
            Long programId,
            String programName,
            double discountRate,
            long discountAmount
    ) {}

    BestDiscountResult findBestDiscount(Long facilityId, Long unitTypeId, int months, long rawRent, LocalDate date);

    PageResponse<DiscountProgramResponse> getDiscountPrograms(Boolean isActive, Pageable pageable);

    DiscountProgramResponse getDiscountProgramById(Long id);

    DiscountProgramResponse createDiscountProgram(CreateDiscountProgramRequest request);

    DiscountProgramResponse updateDiscountProgram(Long id, UpdateDiscountProgramRequest request);

    void deleteDiscountProgram(Long id);
}
