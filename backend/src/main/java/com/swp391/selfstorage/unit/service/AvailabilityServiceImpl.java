package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.entity.FacilityStatus;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.unit.dto.AvailabilityResponse;
import com.swp391.selfstorage.policy.dto.SurchargeLineResponse;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.ExtraFeeTypeRepository;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import com.swp391.selfstorage.policy.service.SurchargeAmountCalculator;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class AvailabilityServiceImpl implements AvailabilityService {

    private final FacilityRepository facilityRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final FacilityUnitTypePriceRepository priceRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final PolicyVersionRepository policyVersionRepository;

    @Autowired(required = false)
    private ExtraFeeTypeRepository extraFeeTypeRepository;

    @Autowired(required = false)
    private AppliedPriceLookup appliedPriceLookup;

    public AvailabilityServiceImpl(
            FacilityRepository facilityRepository,
            UnitTypeRepository unitTypeRepository,
            FacilityUnitTypePriceRepository priceRepository,
            StorageUnitRepository storageUnitRepository,
            PolicyVersionRepository policyVersionRepository
    ) {
        this.facilityRepository = facilityRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.priceRepository = priceRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.policyVersionRepository = policyVersionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AvailabilityResponse checkAvailability(Long facilityId, Long unitTypeId, LocalDate startDate, Integer rentalMonths) {
        if (startDate == null || startDate.isBefore(LocalDate.now())) {
            throw new CustomException(ErrorCode.INVALID_START_DATE, "Ngày bắt đầu thuê không được ở trong quá khứ");
        }
        if (rentalMonths == null || rentalMonths < 1) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Số tháng thuê tối thiểu là 1 tháng");
        }

        Facility facility = facilityRepository.findById(facilityId)
                .filter(f -> f.getStatus() == FacilityStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND, "Không tìm thấy cơ sở hoặc cơ sở đã ngừng hoạt động"));

        UnitType unitType = unitTypeRepository.findById(unitTypeId)
                .filter(UnitType::isActive)
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND, "Không tìm thấy loại ô kho"));

        long monthlyPrice;
        if (appliedPriceLookup != null) {
            monthlyPrice = appliedPriceLookup.resolveMonthlyPrice(facilityId, unitTypeId)
                    .filter(p -> p > 0)
                    .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND,
                            "Loại ô kho chưa được cấu hình giá tại cơ sở này"));
        } else {
            FacilityUnitTypePrice price = priceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                    .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND,
                            "Loại ô kho chưa được cấu hình giá tại cơ sở này"));
            if (price.getMonthlyPrice() == null || price.getMonthlyPrice() <= 0) {
                throw new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND,
                        "Loại ô kho chưa được cấu hình giá tại cơ sở này");
            }
            monthlyPrice = price.getMonthlyPrice();
        }

        LocalDate endDateExclusive = startDate.plusMonths(rentalMonths);
        long totalRentalFee = monthlyPrice * rentalMonths;
        PolicyVersion policy = requireActivePolicy();
        BigDecimal multiplier = policy.getDepositMultiplier() != null
                ? policy.getDepositMultiplier()
                : BigDecimal.ONE;
        long depositAmount = Math.round((monthlyPrice * multiplier.doubleValue()) / 1000.0) * 1000;
        List<SurchargeLineResponse> surchargeLines = List.of();
        if (extraFeeTypeRepository != null) {
            surchargeLines = SurchargeAmountCalculator.lines(
                    extraFeeTypeRepository.findApplicable(facilityId, LocalDate.now()),
                    monthlyPrice,
                    rentalMonths);
        }
        long surchargeTotal = SurchargeAmountCalculator.total(surchargeLines);

        long exploitableUnits = storageUnitRepository.countExploitableUnits(
                facilityId, unitTypeId, List.of(StorageUnitStatus.MAINTENANCE, StorageUnitStatus.OUT_OF_SERVICE)
        );

        int bufferDays = policy.getRentalBufferDays();
        long busyUnits = storageUnitRepository.countBusyUnits(
                facilityId, unitTypeId, startDate, endDateExclusive, bufferDays
        );

        long availableSlots = Math.max(0, exploitableUnits - busyUnits);

        return AvailabilityResponse.builder()
                .facilityId(facilityId)
                .unitTypeId(unitTypeId)
                .startDate(startDate)
                .endDateExclusive(endDateExclusive)
                .rentalMonths(rentalMonths)
                .availableSlots(availableSlots)
                .monthlyPrice(monthlyPrice)
                .totalRentalFee(totalRentalFee)
                .depositAmount(depositAmount)
                .surcharges(surchargeLines)
                .surchargeTotal(surchargeTotal)
                .build();
    }

    private PolicyVersion requireActivePolicy() {
        if (policyVersionRepository == null) {
            throw new CustomException(ErrorCode.POLICY_NOT_FOUND);
        }
        PolicyVersion policy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDesc(OffsetDateTime.now())
                .orElseThrow(() -> new CustomException(ErrorCode.POLICY_NOT_FOUND));
        if (policy.getRentalBufferDays() == null) {
            throw new CustomException(ErrorCode.POLICY_NOT_FOUND, "Chinh sach hieu luc thieu rental_buffer_days");
        }
        return policy;
    }
}
