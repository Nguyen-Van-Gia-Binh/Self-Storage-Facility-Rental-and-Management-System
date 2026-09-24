package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
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

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class StorageUnitServiceImpl implements StorageUnitService {

    private final StorageUnitRepository storageUnitRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final FacilityUnitTypePriceRepository priceRepository;
    private final UnitMapper mapper;

    public StorageUnitServiceImpl(StorageUnitRepository storageUnitRepository,
                                  UnitTypeRepository unitTypeRepository,
                                  UnitMapper mapper) {
        this(storageUnitRepository, unitTypeRepository, null, mapper);
    }

    public StorageUnitServiceImpl(StorageUnitRepository storageUnitRepository,
                                  UnitTypeRepository unitTypeRepository,
                                  FacilityUnitTypePriceRepository priceRepository,
                                  UnitMapper mapper) {
        this.storageUnitRepository = storageUnitRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.priceRepository = priceRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StorageUnitResponse> getStorageUnitsByFacility(Long facilityId, Long unitTypeId, StorageUnitStatus status, Pageable pageable) {
        return getStorageUnitsByFacility(facilityId, unitTypeId, status, null, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StorageUnitResponse> getStorageUnitsByFacility(
            Long facilityId, Long unitTypeId, StorageUnitStatus status, Integer floor, String position, Pageable pageable) {
        Page<StorageUnit> page;
        if (floor != null || position != null) {
            page = storageUnitRepository.findByFacilityIdAndAdvancedFilters(facilityId, unitTypeId, status, floor, position, pageable);
        } else {
            page = storageUnitRepository.findByFacilityIdAndFilters(facilityId, unitTypeId, status, pageable);
        }

        List<StorageUnitResponse> content = page.getContent().stream().map(su -> {
            UnitType ut = unitTypeRepository.findById(su.getUnitTypeId()).orElse(null);
            Long price = (priceRepository != null)
                    ? priceRepository.findByFacilityIdAndUnitTypeId(facilityId, su.getUnitTypeId())
                            .map(FacilityUnitTypePrice::getMonthlyPrice).orElse(0L)
                    : 0L;
            return mapper.toStorageUnitResponse(su, ut, price);
        }).toList();

        return new PageResponse<>(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    @Override
    @Transactional(readOnly = true)
    public StorageUnitResponse getStorageUnitById(Long facilityId, Long unitId) {
        StorageUnit su = storageUnitRepository.findByIdAndFacilityId(unitId, facilityId)
                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND));

        UnitType ut = unitTypeRepository.findById(su.getUnitTypeId()).orElse(null);
        Long price = (priceRepository != null)
                ? priceRepository.findByFacilityIdAndUnitTypeId(facilityId, su.getUnitTypeId())
                        .map(FacilityUnitTypePrice::getMonthlyPrice).orElse(0L)
                : 0L;

        return mapper.toStorageUnitResponse(su, ut, price);
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
