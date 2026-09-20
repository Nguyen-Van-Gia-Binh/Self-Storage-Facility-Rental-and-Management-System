package com.swp391.selfstorage.policy.mapper;

import com.swp391.selfstorage.policy.dto.CreateSurchargeRequest;
import com.swp391.selfstorage.policy.dto.SurchargeResponse;
import com.swp391.selfstorage.policy.dto.UpdateSurchargeRequest;
import com.swp391.selfstorage.policy.entity.ExtraFeeType;
import org.springframework.stereotype.Component;

@Component
public class SurchargeMapper {
    public ExtraFeeType toEntity(CreateSurchargeRequest request) {
        if (request == null)
            return null;
        return ExtraFeeType.builder()
                .code(request.getCode().trim().toUpperCase())
                .name(request.getName().trim())
                .amount(request.getAmount())
                .isActive(true)
                .build();
    }

    public void updateEntity(ExtraFeeType entity, UpdateSurchargeRequest request) {
        if (entity == null || request == null)
            return;
        entity.setName(request.getName().trim());
        entity.setAmount(request.getAmount());
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
    }

    public SurchargeResponse toResponse(ExtraFeeType entity) {
        if (entity == null)
            return null;
        return SurchargeResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .amount(entity.getAmount())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
