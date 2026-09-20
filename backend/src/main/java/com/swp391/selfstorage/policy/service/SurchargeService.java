package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.policy.dto.CreateSurchargeRequest;
import com.swp391.selfstorage.policy.dto.SurchargeResponse;
import com.swp391.selfstorage.policy.dto.UpdateSurchargeRequest;
import org.springframework.data.domain.Pageable;

public interface SurchargeService {

    SurchargeResponse createSurcharge(CreateSurchargeRequest request);

    PageResponse<SurchargeResponse> getSurcharges(Boolean isActive, Pageable pageable);

    SurchargeResponse getSurchargeById(Long id);

    SurchargeResponse updateSurcharge(Long id, UpdateSurchargeRequest request);
}
