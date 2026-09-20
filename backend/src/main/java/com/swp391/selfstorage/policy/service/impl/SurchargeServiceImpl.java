package com.swp391.selfstorage.policy.service.impl;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.policy.dto.CreateSurchargeRequest;
import com.swp391.selfstorage.policy.dto.SurchargeResponse;
import com.swp391.selfstorage.policy.dto.UpdateSurchargeRequest;
import com.swp391.selfstorage.policy.entity.ExtraFeeType;
import com.swp391.selfstorage.policy.mapper.SurchargeMapper;
import com.swp391.selfstorage.policy.repository.ExtraFeeTypeRepository;
import com.swp391.selfstorage.policy.service.SurchargeService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SurchargeServiceImpl implements SurchargeService {

    private final ExtraFeeTypeRepository extraFeeTypeRepository;
    private final SurchargeMapper surchargeMapper;

    public SurchargeServiceImpl(ExtraFeeTypeRepository extraFeeTypeRepository,
            SurchargeMapper surchargeMapper) {
        this.extraFeeTypeRepository = extraFeeTypeRepository;
        this.surchargeMapper = surchargeMapper;
    }

    @Override
    @Transactional
    public SurchargeResponse createSurcharge(CreateSurchargeRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase();

        // 1. Kiểm tra nghiệp vụ: Chặn trùng mã phụ phí
        if (extraFeeTypeRepository.existsByCode(normalizedCode)) {
            throw new CustomException(ErrorCode.SURCHARGE_CODE_ALREADY_EXISTS);
        }

        // 2. Chuyển DTO sang Entity và lưu vào CSDL
        ExtraFeeType entity = surchargeMapper.toEntity(request);
        entity.setCode(normalizedCode);
        ExtraFeeType savedEntity = extraFeeTypeRepository.save(entity);

        // 3. Trả về DTO kết quả
        return surchargeMapper.toResponse(savedEntity);
    }

    @Override
    public PageResponse<SurchargeResponse> getSurcharges(Boolean isActive, Pageable pageable) {
        Page<ExtraFeeType> page = (isActive != null)
                ? extraFeeTypeRepository.findByIsActive(isActive, pageable)
                : extraFeeTypeRepository.findAll(pageable);

        return PageResponse.from(page.map(surchargeMapper::toResponse));
    }

    @Override
    public SurchargeResponse getSurchargeById(Long id) {
        ExtraFeeType entity = extraFeeTypeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.SURCHARGE_NOT_FOUND));

        return surchargeMapper.toResponse(entity);
    }

    @Override
    @Transactional
    public SurchargeResponse updateSurcharge(Long id, UpdateSurchargeRequest request) {
        ExtraFeeType entity = extraFeeTypeRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.SURCHARGE_NOT_FOUND));

        surchargeMapper.updateEntity(entity, request);
        ExtraFeeType updatedEntity = extraFeeTypeRepository.save(entity);

        return surchargeMapper.toResponse(updatedEntity);
    }
}
