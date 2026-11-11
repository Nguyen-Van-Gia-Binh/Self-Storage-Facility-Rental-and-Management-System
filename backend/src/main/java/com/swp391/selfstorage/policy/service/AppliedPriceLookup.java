package com.swp391.selfstorage.policy.service;

import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePriceVersion;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceVersionRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resolve giá đang áp dụng theo phiên bản newest với effective_from &lt;= hôm nay (Asia/Ho_Chi_Minh).
 * Fallback live facility_unit_type_price cho dữ liệu legacy.
 */
@Service
@Transactional(readOnly = true)
public class AppliedPriceLookup {

    public static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final FacilityUnitTypePriceVersionRepository versionRepository;
    private final FacilityUnitTypePriceRepository priceRepository;
    private final UnitTypeRepository unitTypeRepository;

    public AppliedPriceLookup(
            FacilityUnitTypePriceVersionRepository versionRepository,
            FacilityUnitTypePriceRepository priceRepository,
            UnitTypeRepository unitTypeRepository) {
        this.versionRepository = versionRepository;
        this.priceRepository = priceRepository;
        this.unitTypeRepository = unitTypeRepository;
    }

    public static LocalDate todayVn() {
        return LocalDate.now(VN_ZONE);
    }

    /**
     * Giá tháng dùng cho quote / availability / renewal / danh sách.
     * Future-only version không được quote; fallback live monthly_price.
     */
    public Optional<Long> resolveMonthlyPrice(Long facilityId, Long unitTypeId) {
        LocalDate today = todayVn();
        Optional<FacilityUnitTypePriceVersion> applied =
                versionRepository.findApplied(facilityId, unitTypeId, today);
        if (applied.isPresent()) {
            return Optional.of(applied.get().getMonthlyPrice());
        }
        return priceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                .map(FacilityUnitTypePrice::getMonthlyPrice)
                .filter(p -> p != null && p > 0);
    }

    /**
     * Tính giá tháng thấp nhất đang áp dụng theo từng cơ sở trong tối đa 3 batch query
     * nhằm triệt tiêu lỗi N+1 khi render danh sách cơ sở.
     */
    public Map<Long, Long> resolveLowestMonthlyPricesByFacilityIds(Collection<Long> facilityIds) {
        if (facilityIds == null || facilityIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<FacilityUnitTypePrice> prices = priceRepository.findAllByFacilityIdIn(facilityIds);
        if (prices == null || prices.isEmpty()) {
            return Collections.emptyMap();
        }

        Set<Long> unitTypeIds = prices.stream()
                .map(FacilityUnitTypePrice::getUnitTypeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (unitTypeIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Set<Long> activeUnitTypeIds = unitTypeRepository.findAllById(unitTypeIds).stream()
                .filter(UnitType::isActive)
                .map(UnitType::getId)
                .collect(Collectors.toSet());
        if (activeUnitTypeIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, Long> latestVersionByPair = new HashMap<>();
        List<FacilityUnitTypePriceVersion> appliedVersions =
                versionRepository.findAppliedByFacilityIdIn(facilityIds, todayVn());
        if (appliedVersions != null) {
            for (FacilityUnitTypePriceVersion version : appliedVersions) {
                if (version.getFacilityId() != null && version.getUnitTypeId() != null) {
                    String pairKey = pairKey(version.getFacilityId(), version.getUnitTypeId());
                    latestVersionByPair.putIfAbsent(pairKey, version.getMonthlyPrice());
                }
            }
        }

        Map<Long, Long> lowestByFacility = new HashMap<>();
        for (FacilityUnitTypePrice row : prices) {
            if (row.getFacilityId() == null || row.getUnitTypeId() == null
                    || !activeUnitTypeIds.contains(row.getUnitTypeId())) {
                continue;
            }
            String pairKey = pairKey(row.getFacilityId(), row.getUnitTypeId());
            Long resolvedPrice = latestVersionByPair.containsKey(pairKey)
                    ? latestVersionByPair.get(pairKey)
                    : row.getMonthlyPrice();
            if (resolvedPrice != null && resolvedPrice > 0) {
                lowestByFacility.merge(row.getFacilityId(), resolvedPrice, Math::min);
            }
        }
        return lowestByFacility;
    }

    private static String pairKey(Long facilityId, Long unitTypeId) {
        return facilityId + ":" + unitTypeId;
    }

    public AppliedPriceInfo describe(Long facilityId, Long unitTypeId) {
        LocalDate today = todayVn();
        Optional<FacilityUnitTypePriceVersion> applied =
                versionRepository.findApplied(facilityId, unitTypeId, today);
        Optional<FacilityUnitTypePriceVersion> scheduled =
                versionRepository.findNextScheduled(facilityId, unitTypeId, today);
        Optional<FacilityUnitTypePrice> live =
                priceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId);

        BigDecimal area = unitTypeRepository.findById(unitTypeId)
                .map(UnitType::getAreaM2)
                .orElse(BigDecimal.ZERO);

        if (applied.isPresent()) {
            FacilityUnitTypePriceVersion a = applied.get();
            return new AppliedPriceInfo(
                    a.getMonthlyPrice(),
                    a.getPricePerM2(),
                    AppliedPriceInfo.STATUS_APPLIED,
                    scheduled.map(FacilityUnitTypePriceVersion::getEffectiveFrom).orElse(null),
                    scheduled.map(FacilityUnitTypePriceVersion::getPricePerM2).orElse(null));
        }

        Long liveMonthly = live.map(FacilityUnitTypePrice::getMonthlyPrice).orElse(null);
        boolean hasLive = liveMonthly != null && liveMonthly > 0;
        boolean hasVersions = versionRepository.existsByFacilityIdAndUnitTypeId(facilityId, unitTypeId);

        if (!hasLive && !hasVersions) {
            return new AppliedPriceInfo(0L, null, AppliedPriceInfo.STATUS_UNLISTED, null, null);
        }

        if (!hasLive && scheduled.isPresent()) {
            FacilityUnitTypePriceVersion s = scheduled.get();
            return new AppliedPriceInfo(
                    0L,
                    null,
                    AppliedPriceInfo.STATUS_PENDING,
                    s.getEffectiveFrom(),
                    s.getPricePerM2());
        }

        // Legacy live row (không có phiên bản đã đến hạn) → Đang áp dụng
        Long pricePerM2 = live.map(FacilityUnitTypePrice::getPricePerM2).orElse(null);
        if (pricePerM2 == null && hasLive) {
            pricePerM2 = MonthlyRentCalculator.derivePricePerM2(liveMonthly, area);
        }
        return new AppliedPriceInfo(
                hasLive ? liveMonthly : 0L,
                pricePerM2,
                hasLive ? AppliedPriceInfo.STATUS_APPLIED : AppliedPriceInfo.STATUS_UNLISTED,
                scheduled.map(FacilityUnitTypePriceVersion::getEffectiveFrom).orElse(null),
                scheduled.map(FacilityUnitTypePriceVersion::getPricePerM2).orElse(null));
    }

    public String versionStatus(FacilityUnitTypePriceVersion version, LocalDate today) {
        if (version.getEffectiveFrom().isAfter(today)) {
            return AppliedPriceInfo.STATUS_PENDING;
        }
        Optional<FacilityUnitTypePriceVersion> applied =
                versionRepository.findApplied(version.getFacilityId(), version.getUnitTypeId(), today);
        if (applied.isPresent() && applied.get().getId().equals(version.getId())) {
            return AppliedPriceInfo.STATUS_APPLIED;
        }
        return AppliedPriceInfo.STATUS_REPLACED;
    }

    public List<FacilityUnitTypePriceVersion> listHistory(Long facilityId, Long unitTypeId) {
        if (unitTypeId != null) {
            return versionRepository.findByFacilityIdAndUnitTypeIdOrderByEffectiveFromDescCreatedAtDesc(
                    facilityId, unitTypeId);
        }
        return versionRepository.findByFacilityIdOrderByEffectiveFromDescCreatedAtDesc(facilityId);
    }
}
