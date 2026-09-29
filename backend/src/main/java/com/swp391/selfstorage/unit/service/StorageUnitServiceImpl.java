package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import org.springframework.beans.factory.annotation.Autowired;
import com.swp391.selfstorage.unit.dto.BatchCreateStorageUnitsRequest;
import com.swp391.selfstorage.unit.dto.CreateStorageUnitRequest;
import com.swp391.selfstorage.unit.dto.StorageUnitResponse;
import com.swp391.selfstorage.unit.dto.UpdateStorageUnitStatusRequest;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.mapper.UnitMapper;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class StorageUnitServiceImpl implements StorageUnitService {

    private final StorageUnitRepository storageUnitRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final FacilityUnitTypePriceRepository priceRepository;
    private final UnitMapper mapper;
    private final PolicyVersionRepository policyVersionRepository;

    @Autowired(required = false)
    private AppliedPriceLookup appliedPriceLookup;

    public StorageUnitServiceImpl(StorageUnitRepository storageUnitRepository,
                                  UnitTypeRepository unitTypeRepository,
                                  UnitMapper mapper) {
        this(storageUnitRepository, unitTypeRepository, null, mapper, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public StorageUnitServiceImpl(StorageUnitRepository storageUnitRepository,
                                  UnitTypeRepository unitTypeRepository,
                                  FacilityUnitTypePriceRepository priceRepository,
                                  UnitMapper mapper,
                                  PolicyVersionRepository policyVersionRepository) {
        this.storageUnitRepository = storageUnitRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.priceRepository = priceRepository;
        this.mapper = mapper;
        this.policyVersionRepository = policyVersionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StorageUnitResponse> getStorageUnitsByFacility(Long facilityId, Long unitTypeId, StorageUnitStatus status, Pageable pageable) {
        return getStorageUnitsByFacility(facilityId, unitTypeId, status, null, null, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StorageUnitResponse> getStorageUnitsByFacility(
            Long facilityId, Long unitTypeId, StorageUnitStatus status, Integer floor, String position, Pageable pageable) {
        return getStorageUnitsByFacility(facilityId, unitTypeId, status, floor, position, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StorageUnitResponse> getStorageUnitsByFacility(
            Long facilityId, Long unitTypeId, StorageUnitStatus status, Integer floor, String position,
            java.time.LocalDate startDate, Integer rentalMonths, Pageable pageable) {
        StorageUnitStatus queryStatus = (startDate != null && rentalMonths != null && rentalMonths > 0) ? null : status;
        Page<StorageUnit> page;
        if (floor != null || position != null) {
            page = storageUnitRepository.findByFacilityIdAndAdvancedFilters(facilityId, unitTypeId, queryStatus, floor, position, pageable);
        } else {
            page = storageUnitRepository.findByFacilityIdAndFilters(facilityId, unitTypeId, queryStatus, pageable);
        }

        int bufferDays = 0;
        boolean ranged = startDate != null && rentalMonths != null && rentalMonths > 0;
        if (ranged) {
            bufferDays = bufferDays();
        }

        List<Long> occupiedUnitIds = ranged
                ? storageUnitRepository.findOccupiedUnitIdsByDateRange(facilityId, startDate, startDate.plusMonths(rentalMonths), bufferDays)
                : List.of();

        List<Long> reservedUnitIds = ranged
                ? storageUnitRepository.findReservedUnitIdsByDateRange(facilityId, startDate, startDate.plusMonths(rentalMonths), bufferDays)
                : List.of();

        List<StorageUnitResponse> content = page.getContent().stream().map(su -> {
            UnitType ut = unitTypeRepository.findById(su.getUnitTypeId()).orElse(null);
            Long price = resolveMonthlyPrice(facilityId, su.getUnitTypeId());
            StorageUnitResponse res = mapper.toStorageUnitResponse(su, ut, price);
            if (startDate != null && rentalMonths != null && rentalMonths > 0) {
                if (su.getStatus() == StorageUnitStatus.MAINTENANCE || su.getStatus() == StorageUnitStatus.OUT_OF_SERVICE) {
                    res.setStatus(su.getStatus());
                } else if (occupiedUnitIds.contains(su.getId())) {
                    res.setStatus(StorageUnitStatus.OCCUPIED);
                } else if (reservedUnitIds.contains(su.getId())) {
                    res.setStatus(StorageUnitStatus.RESERVED);
                } else {
                    res.setStatus(StorageUnitStatus.AVAILABLE);
                }
            }
            return res;
        }).filter(res -> status == null || res.getStatus() == status).toList();

        return new PageResponse<>(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    private int bufferDays() {
        if (policyVersionRepository == null) {
            throw new CustomException(ErrorCode.POLICY_NOT_FOUND);
        }
        PolicyVersion policy = policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now())
                .orElseThrow(() -> new CustomException(ErrorCode.POLICY_NOT_FOUND));
        if (policy.getRentalBufferDays() == null) {
            throw new CustomException(ErrorCode.POLICY_NOT_FOUND, "Chinh sach hieu luc thieu rental_buffer_days");
        }
        return policy.getRentalBufferDays();
    }

    @Override
    @Transactional(readOnly = true)
    public StorageUnitResponse getStorageUnitById(Long facilityId, Long unitId) {
        StorageUnit su = storageUnitRepository.findByIdAndFacilityId(unitId, facilityId)
                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND));

        UnitType ut = unitTypeRepository.findById(su.getUnitTypeId()).orElse(null);
        Long price = resolveMonthlyPrice(facilityId, su.getUnitTypeId());

        return mapper.toStorageUnitResponse(su, ut, price);
    }

    private Long resolveMonthlyPrice(Long facilityId, Long unitTypeId) {
        if (appliedPriceLookup != null) {
            return appliedPriceLookup.resolveMonthlyPrice(facilityId, unitTypeId).orElse(0L);
        }
        if (priceRepository != null) {
            return priceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                    .map(FacilityUnitTypePrice::getMonthlyPrice).orElse(0L);
        }
        return 0L;
    }

    @Override
    public StorageUnitResponse createStorageUnit(Long facilityId, CreateStorageUnitRequest request) {
        UnitType ut = unitTypeRepository.findById(request.getUnitTypeId())
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));

        if (storageUnitRepository.existsByFacilityIdAndCode(facilityId, request.getCode())) {
            throw new CustomException(ErrorCode.STORAGE_UNIT_CODE_ALREADY_EXISTS);
        }

        StorageUnit su = StorageUnit.builder()
                .facilityId(facilityId)
                .unitTypeId(ut.getId())
                .code(request.getCode())
                .floor(request.getFloor())
                .position(request.getPosition())
                .locationNote(request.getLocationNote())
                .status(StorageUnitStatus.AVAILABLE)
                .build();

        su = storageUnitRepository.save(su);
        return mapper.toStorageUnitResponse(su, ut.getName());
    }

    @Override
    public List<StorageUnitResponse> batchCreateStorageUnits(Long facilityId, BatchCreateStorageUnitsRequest request) {
        UnitType ut = unitTypeRepository.findById(request.getUnitTypeId())
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));

        List<StorageUnitResponse> results = new ArrayList<>();
        for (int i = request.getStartNumber(); i <= request.getEndNumber(); i++) {
            String code = request.getPrefix() + i;
            if (storageUnitRepository.existsByFacilityIdAndCode(facilityId, code)) {
                throw new CustomException(ErrorCode.STORAGE_UNIT_CODE_ALREADY_EXISTS);
            }

            StorageUnit su = StorageUnit.builder()
                    .facilityId(facilityId)
                    .unitTypeId(ut.getId())
                    .code(code)
                    .floor(request.getFloor())
                    .position(request.getPosition())
                    .locationNote(request.getPosition() != null ? "Tầng " + request.getFloor() + " - " + request.getPosition() : null)
                    .status(StorageUnitStatus.AVAILABLE)
                    .build();

            su = storageUnitRepository.save(su);
            results.add(mapper.toStorageUnitResponse(su, ut.getName()));
        }

        return results;
    }

    @Override
    public StorageUnitResponse updateStorageUnitStatus(Long facilityId, Long unitId, UpdateStorageUnitStatusRequest request) {
        StorageUnit su = storageUnitRepository.findByIdAndFacilityId(unitId, facilityId)
                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND));

        if (su.getStatus() == StorageUnitStatus.OCCUPIED) {
            throw new CustomException(ErrorCode.STORAGE_UNIT_OCCUPIED);
        }

        if (!su.getStatus().canTransitionTo(request.getStatus())) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        su.setStatus(request.getStatus());
        su = storageUnitRepository.save(su);

        String typeName = unitTypeRepository.findById(su.getUnitTypeId())
                .map(UnitType::getName).orElse("");

        return mapper.toStorageUnitResponse(su, typeName);
    }
}
