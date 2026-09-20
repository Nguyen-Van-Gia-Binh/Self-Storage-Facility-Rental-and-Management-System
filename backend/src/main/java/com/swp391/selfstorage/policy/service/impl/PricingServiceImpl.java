package com.swp391.selfstorage.policy.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;
import com.swp391.selfstorage.policy.service.PricingService;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PricingServiceImpl implements PricingService {

    private final FacilityUnitTypePriceRepository priceRepository;
    private final FacilityRepository facilityRepository;
    private final UnitTypeRepository unitTypeRepository;

    public PricingServiceImpl(FacilityUnitTypePriceRepository priceRepository,
            FacilityRepository facilityRepository, UnitTypeRepository unitTypeRepository) {
        this.priceRepository = priceRepository;
        this.facilityRepository = facilityRepository;
        this.unitTypeRepository = unitTypeRepository;
    }

    @Override
    public List<FacilityPriceResponse> getPricesByFacility(Long facilityId) {
        if (!facilityRepository.existsById(facilityId)) {
            throw new CustomException(ErrorCode.FACILITY_NOT_FOUND);
        }

        List<FacilityUnitTypePrice> prices = priceRepository.findAllByFacilityId(facilityId);

        return prices.stream().map(price -> {
            UnitType unitType = unitTypeRepository.findById(price.getUnitTypeId()).orElse(null);
            return FacilityPriceResponse.builder()
                    .id(price.getId())
                    .facilityId(price.getFacilityId())
                    .unitTypeId(price.getUnitTypeId())
                    .unitTypeCode(unitType != null ? unitType.getCode() : null)
                    .unitTypeName(unitType != null ? unitType.getName() : null)
                    .monthlyPrice(price.getMonthlyPrice())
                    .updatedAt(price.getUpdatedAt())
                    .build();
        }).toList();
    }

    @Override
    @Transactional
    public FacilityPriceResponse updatePrice(Long facilityId, Long unitTypeId, UpdatePriceRequest request) {
        Long price = request.getMonthlyPrice();

        // Đơn giá phải > 0 và là bội số của 1000 VND
        if (price == null || price <= 0 || price % 1000 != 0) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Đơn giá tháng phải lớn hơn 0 và là bội số của 1000 VND");
        }

        // Kiểm tra tồn tại cơ sở
        if (!facilityRepository.existsById(facilityId)) {
            throw new CustomException(ErrorCode.FACILITY_NOT_FOUND);
        }

        // Kiểm tra tồn tại loại ô kho
        UnitType unitType = unitTypeRepository.findById(unitTypeId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));

        // Cơ chế Upsert: Cập nhật nếu đã có, tạo mới nếu loại kho chưa từng niêm yết
        // tại cơ sở
        FacilityUnitTypePrice priceEntity = priceRepository
                .findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                .orElseGet(() -> FacilityUnitTypePrice.builder()
                        .facilityId(facilityId)
                        .unitTypeId(unitTypeId)
                        .build());
        priceEntity.setMonthlyPrice(price);
        FacilityUnitTypePrice saved = priceRepository.save(priceEntity);

        return FacilityPriceResponse.builder()
                .id(saved.getId())
                .facilityId(saved.getFacilityId())
                .unitTypeId(saved.getUnitTypeId())
                .unitTypeCode(unitType.getCode())
                .unitTypeName(unitType.getName())
                .monthlyPrice(saved.getMonthlyPrice())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

}
