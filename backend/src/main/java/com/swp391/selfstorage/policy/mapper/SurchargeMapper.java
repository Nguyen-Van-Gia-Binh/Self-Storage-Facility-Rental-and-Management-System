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
        String feeType = request.getType() == null || request.getType().isBlank()
                ? "FIXED"
                : request.getType().trim().toUpperCase();
        return ExtraFeeType.builder()
                .name(request.getName().trim())
                .category(request.getCategory())
                .amount(request.getAmount())
                .facilityId(request.getFacilityId())
                .feeType(feeType)
                .effectiveFrom(request.getEffectiveDate())
                .isActive(true)
                .build();
    }

    public void updateEntity(ExtraFeeType entity, UpdateSurchargeRequest request) {
        if (entity == null || request == null)
            return;
        entity.setName(request.getName().trim());
        entity.setAmount(request.getAmount());
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            entity.setCategory(request.getCategory().trim().toUpperCase());
        }
        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }
        if (request.getEffectiveDate() != null) {
            entity.setEffectiveFrom(request.getEffectiveDate());
        }
    }

    public SurchargeResponse toResponse(ExtraFeeType entity) {
        if (entity == null)
            return null;
        return SurchargeResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .category(entity.getCategory())
                .amount(entity.getAmount())
                .facilityId(entity.getFacilityId())
                .facilityName(entity.getFacilityId() == null ? "Toàn hệ thống" : null)
                .type(entity.getFeeType() == null ? "FIXED" : entity.getFeeType())
                .effectiveDate(entity.getEffectiveFrom())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
