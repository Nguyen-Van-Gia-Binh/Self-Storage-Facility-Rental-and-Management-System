package com.swp391.selfstorage.facility.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.facility.dto.CreateFacilityRequest;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.dto.UpdateFacilityRequest;
import com.swp391.selfstorage.facility.dto.UpdateFacilityStatusRequest;
import org.springframework.data.domain.Pageable;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import java.util.List;

public interface FacilityService {

    PageResponse<FacilityResponse> getFacilities(String keyword, Boolean isActive, Pageable pageable);

    FacilityResponse getFacilityById(Long id);

    FacilityResponse createFacility(CreateFacilityRequest request);

    FacilityResponse updateFacility(Long id, UpdateFacilityRequest request);

    FacilityResponse updateFacilityStatus(Long id, UpdateFacilityStatusRequest request);

    List<FacilityResponse> getMyAssignedFacilities(UserPrincipal currentUser);
}
