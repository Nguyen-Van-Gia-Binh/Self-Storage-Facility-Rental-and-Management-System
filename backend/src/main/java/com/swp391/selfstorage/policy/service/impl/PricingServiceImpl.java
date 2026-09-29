package com.swp391.selfstorage.policy.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.PriceVersionResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;
import com.swp391.selfstorage.policy.service.AppliedPriceInfo;
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import com.swp391.selfstorage.policy.service.MonthlyRentCalculator;
import com.swp391.selfstorage.policy.service.PricingService;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePriceVersion;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceVersionRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;

@Service
@Transactional(readOnly = true)
public class PricingServiceImpl implements PricingService {

    private final FacilityUnitTypePriceRepository priceRepository;
    private final FacilityUnitTypePriceVersionRepository versionRepository;
    private final FacilityRepository facilityRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final AppliedPriceLookup appliedPriceLookup;

    public PricingServiceImpl(
            FacilityUnitTypePriceRepository priceRepository,
            FacilityRepository facilityRepository,
            UnitTypeRepository unitTypeRepository) {
        this(priceRepository, null, facilityRepository, unitTypeRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public PricingServiceImpl(
            FacilityUnitTypePriceRepository priceRepository,
            FacilityUnitTypePriceVersionRepository versionRepository,
            FacilityRepository facilityRepository,
            UnitTypeRepository unitTypeRepository,
            AppliedPriceLookup appliedPriceLookup) {
        this.priceRepository = priceRepository;
        this.versionRepository = versionRepository;
        this.facilityRepository = facilityRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.appliedPriceLookup = appliedPriceLookup;
    }

    @Override
    public List<FacilityPriceResponse> getPricesByFacility(Long facilityId) {
        if (!facilityRepository.existsById(facilityId)) {
            throw new CustomException(ErrorCode.FACILITY_NOT_FOUND);
        }

        List<FacilityUnitTypePrice> prices = priceRepository.findAllByFacilityId(facilityId);

        return prices.stream().map(price -> {
            UnitType unitType = unitTypeRepository.findById(price.getUnitTypeId()).orElse(null);
            AppliedPriceInfo info = appliedPriceLookup != null
                    ? appliedPriceLookup.describe(facilityId, price.getUnitTypeId())
                    : null;
            Long monthly = info != null && info.getMonthlyPrice() != null
                    ? info.getMonthlyPrice()
                    : price.getMonthlyPrice();
            Long perM2 = info != null ? info.getPricePerM2() : price.getPricePerM2();
            if (perM2 == null && unitType != null && monthly != null && monthly > 0) {
                perM2 = MonthlyRentCalculator.derivePricePerM2(monthly, unitType.getAreaM2());
            }
            return FacilityPriceResponse.builder()
                    .id(price.getId())
                    .facilityId(price.getFacilityId())
                    .unitTypeId(price.getUnitTypeId())
                    .unitTypeCode(unitType != null ? unitType.getCode() : null)
                    .unitTypeName(unitType != null ? unitType.getName() : null)
                    .monthlyPrice(monthly)
                    .pricePerM2(perM2)
                    .priceStatus(info != null ? info.getPriceStatus() : null)
                    .scheduledEffectiveFrom(info != null ? info.getScheduledEffectiveFrom() : null)
                    .scheduledPricePerM2(info != null ? info.getScheduledPricePerM2() : null)
                    .updatedAt(price.getUpdatedAt())
                    .build();
        }).toList();
    }

    @Override
    public List<PriceVersionResponse> getPriceHistory(Long facilityId, Long unitTypeId) {
        if (!facilityRepository.existsById(facilityId)) {
            throw new CustomException(ErrorCode.FACILITY_NOT_FOUND);
        }
        if (versionRepository == null || appliedPriceLookup == null) {
            return List.of();
        }
        LocalDate today = AppliedPriceLookup.todayVn();
        return appliedPriceLookup.listHistory(facilityId, unitTypeId).stream().map(v -> {
            UnitType unitType = unitTypeRepository.findById(v.getUnitTypeId()).orElse(null);
            return PriceVersionResponse.builder()
                    .id(v.getId())
                    .facilityId(v.getFacilityId())
                    .unitTypeId(v.getUnitTypeId())
                    .unitTypeCode(unitType != null ? unitType.getCode() : null)
                    .unitTypeName(unitType != null ? unitType.getName() : null)
                    .pricePerM2(v.getPricePerM2())
                    .monthlyPrice(v.getMonthlyPrice())
                    .effectiveFrom(v.getEffectiveFrom())
                    .status(appliedPriceLookup.versionStatus(v, today))
                    .createdAt(v.getCreatedAt())
                    .build();
        }).toList();
    }

    @Override
    @Transactional
    public FacilityPriceResponse updatePrice(Long facilityId, Long unitTypeId, UpdatePriceRequest request) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));
        if (facility.getStatus() != FacilityStatus.ACTIVE) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Không thể cập nhật giá khi cơ sở đang ngừng hoạt động");
        }

        UnitType unitType = unitTypeRepository.findById(unitTypeId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));

        BigDecimal area = unitType.getAreaM2();
        if (area == null || area.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Diện tích loại ô kho phải lớn hơn 0");
        }

        Long pricePerM2 = request.getPricePerM2();
        long monthlyRent;
        if (pricePerM2 != null) {
            if (pricePerM2 <= 0 || pricePerM2 % 1000 != 0) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                        "Đơn giá m² phải lớn hơn 0 và là bội số của 1000 VND");
            }
            monthlyRent = MonthlyRentCalculator.computeMonthlyRent(pricePerM2, area);
        } else {
            // Legacy path: monthlyPrice trực tiếp (test cũ)
            Long price = request.getMonthlyPrice();
            if (price == null || price <= 0 || price % 1000 != 0) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                        "Đơn giá tháng phải lớn hơn 0 và là bội số của 1000 VND");
            }
            monthlyRent = price;
            pricePerM2 = MonthlyRentCalculator.derivePricePerM2(monthlyRent, area);
            if (pricePerM2 == null || pricePerM2 <= 0) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                        "Không tính được đơn giá m² từ giá tháng và diện tích");
            }
        }

        LocalDate today = AppliedPriceLookup.todayVn();
        LocalDate effectiveFrom = request.getEffectiveDate() != null ? request.getEffectiveDate() : today;
        if (effectiveFrom.isBefore(today)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Ngày hiệu lực không được ở quá khứ");
        }

        if (versionRepository != null) {
            FacilityUnitTypePriceVersion version = FacilityUnitTypePriceVersion.builder()
                    .facilityId(facilityId)
                    .unitTypeId(unitTypeId)
                    .pricePerM2(pricePerM2)
                    .monthlyPrice(monthlyRent)
                    .effectiveFrom(effectiveFrom)
                    .createdBy(currentActorId())
                    .build();
            versionRepository.save(version);
        }

        boolean applyNow = !effectiveFrom.isAfter(today);
        FacilityUnitTypePrice priceEntity = priceRepository
                .findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                .orElse(null);

        if (applyNow) {
            if (priceEntity == null) {
                priceEntity = FacilityUnitTypePrice.builder()
                        .facilityId(facilityId)
                        .unitTypeId(unitTypeId)
                        .build();
            }
            priceEntity.setMonthlyPrice(monthlyRent);
            priceEntity.setPricePerM2(pricePerM2);
            priceEntity = priceRepository.save(priceEntity);
        } else if (priceEntity == null) {
            // Chưa có live price: không ghi giá tương lai vào live row
            priceEntity = null;
        }

        AppliedPriceInfo info = appliedPriceLookup != null
                ? appliedPriceLookup.describe(facilityId, unitTypeId)
                : null;

        Long responseMonthly = applyNow
                ? monthlyRent
                : (priceEntity != null ? priceEntity.getMonthlyPrice() : 0L);
        Long responsePerM2 = applyNow
                ? pricePerM2
                : (priceEntity != null ? priceEntity.getPricePerM2() : null);
        if (info != null) {
            responseMonthly = info.getMonthlyPrice() != null ? info.getMonthlyPrice() : responseMonthly;
            responsePerM2 = info.getPricePerM2() != null ? info.getPricePerM2() : responsePerM2;
        }

        return FacilityPriceResponse.builder()
                .id(priceEntity != null ? priceEntity.getId() : null)
                .facilityId(facilityId)
                .unitTypeId(unitTypeId)
                .unitTypeCode(unitType.getCode())
                .unitTypeName(unitType.getName())
                .monthlyPrice(responseMonthly)
                .pricePerM2(responsePerM2)
                .effectiveFrom(effectiveFrom)
                .priceStatus(info != null ? info.getPriceStatus() : null)
                .scheduledEffectiveFrom(info != null ? info.getScheduledEffectiveFrom() : null)
                .scheduledPricePerM2(info != null ? info.getScheduledPricePerM2() : null)
                .updatedAt(priceEntity != null ? priceEntity.getUpdatedAt() : null)
                .build();
    }

    private Long currentActorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.getId();
    }
}
