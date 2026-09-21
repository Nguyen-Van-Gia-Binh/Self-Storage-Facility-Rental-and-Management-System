package com.swp391.selfstorage.policy.service;

import org.springframework.data.domain.Pageable;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.policy.dto.CreatePolicyRequest;
import com.swp391.selfstorage.policy.dto.PolicyResponse;

public interface PolicyService {

    PolicyResponse getActivePolicy();

    PageResponse<PolicyResponse> getPolicies(Pageable pageable);

    PolicyResponse getPolicyById(Long id);

    PolicyResponse createPolicy(CreatePolicyRequest request, Long publishedBy);
}
