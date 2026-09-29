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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import java.util.Collections;
import java.util.List;

@Service
@Transactional
public class FacilityServiceImpl implements FacilityService {

    private final FacilityRepository facilityRepository;
    private final FacilityMapper facilityMapper;
    private final UserFacilityAssignmentRepository userFacilityAssignmentRepository;

    public FacilityServiceImpl(FacilityRepository facilityRepository, FacilityMapper facilityMapper) {
        this(facilityRepository, facilityMapper, null);
    }

    @Autowired
    public FacilityServiceImpl(FacilityRepository facilityRepository, FacilityMapper facilityMapper, UserFacilityAssignmentRepository userFacilityAssignmentRepository) {
        this.facilityRepository = facilityRepository;
        this.facilityMapper = facilityMapper;
        this.userFacilityAssignmentRepository = userFacilityAssignmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FacilityResponse> getFacilities(String keyword, Boolean isActive, Pageable pageable) {
        FacilityStatus status = null;
        if (isActive != null) {
            status = isActive ? FacilityStatus.ACTIVE : FacilityStatus.INACTIVE;
        }
        Page<Facility> page = facilityRepository.findByFilter(keyword, status, pageable);
        return PageResponse.from(page.map(facility -> {
            FacilityResponse resp = facilityMapper.toResponse(facility);
            enrichFacilityMetrics(resp);
            return resp;
        }));
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityResponse getFacilityById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));
        FacilityResponse resp = facilityMapper.toResponse(facility);
        enrichFacilityMetrics(resp);
        return resp;
    }

    private boolean isAssignableFacility(Facility facility) {
        if (facility == null || facility.getStatus() != FacilityStatus.ACTIVE) {
            return false;
        }
        String name = facility.getName() == null ? "" : facility.getName().toLowerCase();
        String code = facility.getCode() == null ? "" : facility.getCode().toLowerCase();
        return !name.contains("sadas") && !code.contains("sadas");
    }

    private void enrichFacilityMetrics(FacilityResponse resp) {
        if (resp == null || resp.getId() == null) return;
        resp.setLowestMonthlyPrice(facilityRepository.findLowestMonthlyPriceByFacilityId(resp.getId()));
        resp.setActiveUnitTypeCount(facilityRepository.countActiveUnitTypesByFacilityId(resp.getId()));
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

    @Override
    @Transactional(readOnly = true)
    public List<FacilityResponse> getMyAssignedFacilities(UserPrincipal currentUser) {
        if (currentUser == null) {
            return Collections.emptyList();
        }

        boolean isFullAccess = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")
                            || a.getAuthority().equals("ROLE_SYSTEM_ADMINISTRATOR")
                            || a.getAuthority().equals("ROLE_BUSINESS_OPERATIONS_MANAGER"));

        List<Facility> facilities;
        if (isFullAccess) {
            facilities = facilityRepository.findAll().stream()
                    .filter(this::isAssignableFacility)
                    .toList();
        } else {
            if (userFacilityAssignmentRepository == null) {
                return Collections.emptyList();
            }
            List<Long> assignedIds = userFacilityAssignmentRepository.findFacilityIdsByUserId(currentUser.getId())
                    .stream()
                    .map(id -> id == null ? null : id.longValue())
                    .filter(id -> id != null)
                    .toList();
            if (assignedIds.isEmpty()) {
                return Collections.emptyList();
            }
            facilities = facilityRepository.findAllById(assignedIds).stream()
                    .filter(this::isAssignableFacility)
                    .toList();
        }

        return facilities.stream().map(facility -> {
            FacilityResponse resp = facilityMapper.toResponse(facility);
            enrichFacilityMetrics(resp);
            return resp;
        }).toList();
    }
}
