package com.swp391.selfstorage.facility.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.dto.CreateFacilityRequest;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.dto.UpdateFacilityRequest;
import com.swp391.selfstorage.facility.dto.UpdateFacilityStatusRequest;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.mapper.FacilityMapper;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FacilityServiceImpl implements FacilityService {

    private final FacilityRepository facilityRepository;
    private final FacilityMapper facilityMapper;

    public FacilityServiceImpl(FacilityRepository facilityRepository, FacilityMapper facilityMapper) {
        this.facilityRepository = facilityRepository;
        this.facilityMapper = facilityMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FacilityResponse> getFacilities(String keyword, Boolean isActive, Pageable pageable) {
        FacilityStatus status = null;
        if (isActive != null) {
            status = isActive ? FacilityStatus.ACTIVE : FacilityStatus.INACTIVE;
        }
        Page<Facility> page = facilityRepository.findByFilter(keyword, status, pageable);
        return PageResponse.from(page.map(facilityMapper::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityResponse getFacilityById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));
        return facilityMapper.toResponse(facility);
    }

    @Override
    public FacilityResponse createFacility(CreateFacilityRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();
        if (facilityRepository.existsByCode(normalizedCode)) {
            throw new CustomException(ErrorCode.FACILITY_CODE_ALREADY_EXISTS);
        }

        Facility facility = facilityMapper.toEntity(request);
        Facility saved = facilityRepository.save(facility);
        return facilityMapper.toResponse(saved);
    }

    @Override
    public FacilityResponse updateFacility(Long id, UpdateFacilityRequest request) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));

        facilityMapper.updateEntity(facility, request);
        Facility updated = facilityRepository.save(facility);
        return facilityMapper.toResponse(updated);
    }

    @Override
    public FacilityResponse updateFacilityStatus(Long id, UpdateFacilityStatusRequest request) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));

        boolean targetActive = Boolean.TRUE.equals(request.getIsActive());

        // Nếu chuyển từ ACTIVE sang INACTIVE, phải kiểm tra xem còn hợp đồng hiệu lực không (US-BM-01.2)
        if (!targetActive && facility.getStatus() == FacilityStatus.ACTIVE) {
            long activeContracts = facilityRepository.countActiveContractsByFacilityId(id);
            if (activeContracts > 0) {
                throw new CustomException(ErrorCode.FACILITY_HAS_ACTIVE_CONTRACTS);
            }
        }

        facility.setStatus(targetActive ? FacilityStatus.ACTIVE : FacilityStatus.INACTIVE);
        Facility saved = facilityRepository.save(facility);
        return facilityMapper.toResponse(saved);
    }
}
