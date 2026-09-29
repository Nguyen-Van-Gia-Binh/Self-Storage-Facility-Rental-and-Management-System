package com.swp391.selfstorage.policy.service.impl;

import java.text.Normalizer;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.CreateSurchargeRequest;
import com.swp391.selfstorage.policy.dto.SurchargeResponse;
import com.swp391.selfstorage.policy.dto.UpdateSurchargeRequest;
import com.swp391.selfstorage.policy.entity.ExtraFeeType;
import com.swp391.selfstorage.policy.mapper.SurchargeMapper;
import com.swp391.selfstorage.policy.repository.ExtraFeeTypeRepository;
import com.swp391.selfstorage.policy.service.SurchargeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SurchargeServiceImpl implements SurchargeService {

    private final ExtraFeeTypeRepository extraFeeTypeRepository;
    private final SurchargeMapper surchargeMapper;

    @Autowired(required = false)
    private FacilityRepository facilityRepository;

    public SurchargeServiceImpl(ExtraFeeTypeRepository extraFeeTypeRepository,
            SurchargeMapper surchargeMapper) {
        this.extraFeeTypeRepository = extraFeeTypeRepository;
        this.surchargeMapper = surchargeMapper;
    }

    @Override
    @Transactional
    public SurchargeResponse createSurcharge(CreateSurchargeRequest request) {
        String feeType = request.getType() == null || request.getType().isBlank()
                ? "FIXED"
                : request.getType().trim().toUpperCase();
        if ("PERCENTAGE".equals(feeType) && (request.getAmount() == null || request.getAmount() < 1 || request.getAmount() > 100)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Tỷ lệ phụ phí phải từ 1% đến 100%");
        }
        if (request.getFacilityId() != null && facilityRepository != null
                && !facilityRepository.existsById(request.getFacilityId())) {
            throw new CustomException(ErrorCode.FACILITY_NOT_FOUND);
        }

        String normalizedCode = resolveCode(request.getCode(), request.getName());

        ExtraFeeType entity = surchargeMapper.toEntity(request);
        entity.setCode(normalizedCode);
        entity.setFeeType(feeType);
        ExtraFeeType savedEntity = extraFeeTypeRepository.save(entity);

        return withFacilityName(surchargeMapper.toResponse(savedEntity));
    }

    @Override
    public PageResponse<SurchargeResponse> getSurcharges(Boolean isActive, Pageable pageable) {
        Page<ExtraFeeType> page = (isActive != null)
                ? extraFeeTypeRepository.findByIsActive(isActive, pageable)
                : extraFeeTypeRepository.findAll(pageable);

        return PageResponse.from(page.map(entity -> withFacilityName(surchargeMapper.toResponse(entity))));
    }

    @Override
    public SurchargeResponse getSurchargeById(Long id) {
        ExtraFeeType entity = extraFeeTypeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.SURCHARGE_NOT_FOUND));

        return withFacilityName(surchargeMapper.toResponse(entity));
    }

    @Override
    @Transactional
    public SurchargeResponse updateSurcharge(Long id, UpdateSurchargeRequest request) {
        ExtraFeeType entity = extraFeeTypeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.SURCHARGE_NOT_FOUND));

        surchargeMapper.updateEntity(entity, request);
        ExtraFeeType updatedEntity = extraFeeTypeRepository.save(entity);

        return withFacilityName(surchargeMapper.toResponse(updatedEntity));
    }

    private String resolveCode(String rawCode, String name) {
        boolean generated = rawCode == null || rawCode.isBlank();
        String normalized = generated ? codeFromName(name) : rawCode.trim().toUpperCase();
        if (normalized.length() > 30) {
            normalized = normalized.substring(0, 30);
        }
        if (!extraFeeTypeRepository.existsByCode(normalized)) {
            return normalized;
        }
        if (!generated) {
            throw new CustomException(ErrorCode.SURCHARGE_CODE_ALREADY_EXISTS);
        }
        for (int n = 2; n <= 50; n++) {
            String suffix = "-" + n;
            int keep = Math.min(normalized.length(), 30 - suffix.length());
            String candidate = normalized.substring(0, Math.max(keep, 1)) + suffix;
            if (candidate.length() > 30) {
                candidate = candidate.substring(0, 30);
            }
            if (!extraFeeTypeRepository.existsByCode(candidate)) {
                return candidate;
            }
        }
        throw new CustomException(ErrorCode.SURCHARGE_CODE_ALREADY_EXISTS);
    }

    private static String codeFromName(String name) {
        String source = name == null ? "" : name;
        String folded = Normalizer.normalize(source, Normalizer.Form.NFD)
                .replace("đ", "d")
                .replace("Đ", "D")
                .replaceAll("\\p{M}", "");
        String code = folded.toUpperCase().replaceAll("[^A-Z0-9]+", "-").replaceAll("^-|-$", "");
        return code.isBlank() ? "FEE" : code;
    }

    private SurchargeResponse withFacilityName(SurchargeResponse response) {
        if (response == null || response.getFacilityId() == null) {
            return response;
        }
        String name = "Cơ sở #" + response.getFacilityId();
        if (facilityRepository != null) {
            name = facilityRepository.findById(response.getFacilityId())
                    .map(Facility::getName)
                    .orElse(name);
        }
        response.setFacilityName(name);
        return response;
    }
}
