package com.swp391.selfstorage.policy.service.impl;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.CreateDiscountProgramRequest;
import com.swp391.selfstorage.policy.dto.DiscountProgramResponse;
import com.swp391.selfstorage.policy.dto.UpdateDiscountProgramRequest;
import com.swp391.selfstorage.policy.entity.DiscountProgram;
import com.swp391.selfstorage.policy.repository.DiscountProgramRepository;
import com.swp391.selfstorage.policy.service.DiscountProgramService;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class DiscountProgramServiceImpl implements DiscountProgramService {

    private final DiscountProgramRepository discountProgramRepository;
    private final FacilityRepository facilityRepository;
    private final UnitTypeRepository unitTypeRepository;

    public DiscountProgramServiceImpl(
            DiscountProgramRepository discountProgramRepository,
            FacilityRepository facilityRepository,
            UnitTypeRepository unitTypeRepository) {
        this.discountProgramRepository = discountProgramRepository;
        this.facilityRepository = facilityRepository;
        this.unitTypeRepository = unitTypeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public BestDiscountResult findBestDiscount(Long facilityId, Long unitTypeId, int months, long rawRent, LocalDate date) {
        if (rawRent <= 0 || months <= 0) {
            return new BestDiscountResult(null, null, 0.0, 0L);
        }
        LocalDate queryDate = date != null ? date : LocalDate.now();
        List<DiscountProgram> applicable = discountProgramRepository.findApplicablePrograms(
                queryDate, months, facilityId, unitTypeId);

        if (applicable == null || applicable.isEmpty()) {
            return new BestDiscountResult(null, null, 0.0, 0L);
        }

        Long bestId = null;
        String bestName = null;
        double bestRate = 0.0;
        long maxDiscount = 0L;

        for (DiscountProgram prog : applicable) {
            long currentDiscount = 0L;
            double rate = 0.0;
            if ("PERCENT".equalsIgnoreCase(prog.getDiscountType())) {
                rate = prog.getDiscountValue().doubleValue() / 100.0;
                currentDiscount = Math.round((rawRent * rate) / 1000.0) * 1000;
            } else if ("AMOUNT".equalsIgnoreCase(prog.getDiscountType())) {
                currentDiscount = Math.min(rawRent, prog.getDiscountValue().longValue());
                rate = rawRent > 0 ? (double) currentDiscount / rawRent : 0.0;
            }

            if (currentDiscount > maxDiscount) {
                maxDiscount = currentDiscount;
                bestRate = rate;
                bestId = prog.getId();
                bestName = prog.getName();
            }
        }

        return new BestDiscountResult(bestId, bestName, bestRate, maxDiscount);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DiscountProgramResponse> getDiscountPrograms(Boolean isActive, Pageable pageable) {
        Page<DiscountProgram> page = isActive != null
                ? discountProgramRepository.findByIsActive(isActive, pageable)
                : discountProgramRepository.findAll(pageable);

        List<DiscountProgramResponse> dtoList = page.getContent().stream()
                .map(this::mapToResponse)
                .toList();

        return new PageResponse<>(dtoList, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }

    @Override
    @Transactional(readOnly = true)
    public DiscountProgramResponse getDiscountProgramById(Long id) {
        DiscountProgram program = discountProgramRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.DISCOUNT_PROGRAM_NOT_FOUND, "Không tìm thấy chương trình khuyến mại ID=" + id));
        return mapToResponse(program);
    }

    @Override
    @Transactional
    public DiscountProgramResponse createDiscountProgram(CreateDiscountProgramRequest request) {
        validateRequest(request.getDiscountType(), request.getDiscountValue(),
                request.getStartDate(), request.getEndDate(), request.getMinRentalMonths(),
                request.getScopeType(), request.getFacilityId(), request.getUnitTypeId());

        DiscountProgram program = DiscountProgram.builder()
                .name(request.getName().trim())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minRentalMonths(request.getMinRentalMonths())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .scopeType(request.getScopeType())
                .facilityId("FACILITY".equals(request.getScopeType()) ? request.getFacilityId() : null)
                .unitTypeId("UNIT_TYPE".equals(request.getScopeType()) ? request.getUnitTypeId() : null)
                .isActive(true)
                .build();

        DiscountProgram saved = discountProgramRepository.save(program);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DiscountProgramResponse updateDiscountProgram(Long id, UpdateDiscountProgramRequest request) {
        DiscountProgram program = discountProgramRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.DISCOUNT_PROGRAM_NOT_FOUND, "Không tìm thấy chương trình khuyến mại ID=" + id));

        validateRequest(request.getDiscountType(), request.getDiscountValue(),
                request.getStartDate(), request.getEndDate(), request.getMinRentalMonths(),
                request.getScopeType(), request.getFacilityId(), request.getUnitTypeId());

        program.setName(request.getName().trim());
        program.setDiscountType(request.getDiscountType());
        program.setDiscountValue(request.getDiscountValue());
        program.setMinRentalMonths(request.getMinRentalMonths());
        program.setStartDate(request.getStartDate());
        program.setEndDate(request.getEndDate());
        program.setScopeType(request.getScopeType());
        program.setFacilityId("FACILITY".equals(request.getScopeType()) ? request.getFacilityId() : null);
        program.setUnitTypeId("UNIT_TYPE".equals(request.getScopeType()) ? request.getUnitTypeId() : null);
        if (request.getIsActive() != null) {
            program.setIsActive(request.getIsActive());
        }

        DiscountProgram updated = discountProgramRepository.save(program);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteDiscountProgram(Long id) {
        DiscountProgram program = discountProgramRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.DISCOUNT_PROGRAM_NOT_FOUND, "Không tìm thấy chương trình khuyến mại ID=" + id));
        program.setIsActive(false);
        discountProgramRepository.save(program);
    }

    private void validateRequest(String discountType, BigDecimal discountValue,
                                 LocalDate startDate, LocalDate endDate, Integer minMonths,
                                 String scopeType, Long facilityId, Long unitTypeId) {
        if (endDate.isBefore(startDate)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
        }
        if (minMonths != null && minMonths < 1) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Số tháng thuê tối thiểu phải từ 1 tháng");
        }
        if ("PERCENT".equalsIgnoreCase(discountType) && (discountValue.compareTo(BigDecimal.ZERO) <= 0 || discountValue.compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Tỷ lệ giảm giá (%) phải lớn hơn 0 và không vượt quá 100%");
        }
        if ("FACILITY".equalsIgnoreCase(scopeType) && facilityId == null) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Phạm vi FACILITY yêu cầu chọn cơ sở");
        }
        if ("UNIT_TYPE".equalsIgnoreCase(scopeType) && unitTypeId == null) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Phạm vi UNIT_TYPE yêu cầu chọn loại kho");
        }
    }

    private DiscountProgramResponse mapToResponse(DiscountProgram entity) {
        String facilityName = null;
        if (entity.getFacilityId() != null && facilityRepository != null) {
            facilityName = facilityRepository.findById(entity.getFacilityId())
                    .map(f -> f.getName()).orElse(null);
        }
        String unitTypeName = null;
        if (entity.getUnitTypeId() != null && unitTypeRepository != null) {
            unitTypeName = unitTypeRepository.findById(entity.getUnitTypeId())
                    .map(u -> u.getName()).orElse(null);
        }

        return DiscountProgramResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .discountType(entity.getDiscountType())
                .discountValue(entity.getDiscountValue())
                .minRentalMonths(entity.getMinRentalMonths())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .scopeType(entity.getScopeType())
                .facilityId(entity.getFacilityId())
                .facilityName(facilityName)
                .unitTypeId(entity.getUnitTypeId())
                .unitTypeName(unitTypeName)
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
