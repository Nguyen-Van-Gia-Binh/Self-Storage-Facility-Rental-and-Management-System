package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.unit.dto.CreateUnitTypeRequest;
import com.swp391.selfstorage.unit.dto.UnitTypeResponse;
import com.swp391.selfstorage.unit.dto.UpdateUnitTypeRequest;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
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

import java.util.List;

@Service
@Transactional
public class UnitTypeServiceImpl implements UnitTypeService {

    private final UnitTypeRepository unitTypeRepository;
    private final FacilityUnitTypePriceRepository priceRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final UnitMapper mapper;

    public UnitTypeServiceImpl(UnitTypeRepository unitTypeRepository,
                               FacilityUnitTypePriceRepository priceRepository,
                               StorageUnitRepository storageUnitRepository,
                               UnitMapper mapper) {
        this.unitTypeRepository = unitTypeRepository;
        this.priceRepository = priceRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UnitTypeResponse> getUnitTypesByFacility(Long facilityId, Boolean isActive, Pageable pageable) {
        Page<UnitType> page = unitTypeRepository.findByFacilityIdAndFilter(facilityId, isActive, pageable);
        List<UnitTypeResponse> content = page.getContent().stream().map(ut -> {
            Long price = priceRepository.findByFacilityIdAndUnitTypeId(facilityId, ut.getId())
                    .map(FacilityUnitTypePrice::getMonthlyPrice)
                    .orElse(0L);
            long totalUnits = storageUnitRepository.countByFacilityIdAndUnitTypeId(facilityId, ut.getId());
            return mapper.toUnitTypeResponse(ut, facilityId, price, totalUnits);
        }).toList();

        return new PageResponse<>(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    @Override
    @Transactional(readOnly = true)
    public UnitTypeResponse getUnitTypeById(Long facilityId, Long unitTypeId) {
        UnitType ut = unitTypeRepository.findById(unitTypeId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));

        Long price = priceRepository.findByFacilityIdAndUnitTypeId(facilityId, ut.getId())
                .map(FacilityUnitTypePrice::getMonthlyPrice)
                .orElse(0L);
        long totalUnits = storageUnitRepository.countByFacilityIdAndUnitTypeId(facilityId, ut.getId());

        return mapper.toUnitTypeResponse(ut, facilityId, price, totalUnits);
    }

    @Override
    public UnitTypeResponse createUnitType(Long facilityId, CreateUnitTypeRequest request) {
        if (unitTypeRepository.existsByCode(request.getCode())) {
            throw new CustomException(ErrorCode.UNIT_TYPE_CODE_ALREADY_EXISTS);
        }

        UnitType unitType = UnitType.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .widthM(request.getWidthM())
                .lengthM(request.getDepthM())
                .heightM(request.getHeightM())
                .isActive(true)
                .build();

        unitType = unitTypeRepository.save(unitType);

        if (request.getMonthlyPrice() != null && request.getMonthlyPrice() > 0) {
            priceRepository.save(FacilityUnitTypePrice.builder()
                    .facilityId(facilityId)
                    .unitTypeId(unitType.getId())
                    .monthlyPrice(request.getMonthlyPrice())
                    .build());
        }

        return mapper.toUnitTypeResponse(unitType, facilityId, request.getMonthlyPrice(), 0L);
    }

    @Override
    public UnitTypeResponse updateUnitType(Long facilityId, Long unitTypeId, UpdateUnitTypeRequest request) {
        UnitType ut = unitTypeRepository.findById(unitTypeId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));

        ut.setName(request.getName());
        ut.setDescription(request.getDescription());
        ut.setWidthM(request.getWidthM());
        ut.setLengthM(request.getDepthM());
        ut.setHeightM(request.getHeightM());
        if (request.getIsActive() != null) {
            ut.setActive(request.getIsActive());
        }

        ut = unitTypeRepository.save(ut);

        if (request.getMonthlyPrice() != null && request.getMonthlyPrice() > 0) {
            FacilityUnitTypePrice price = priceRepository.findByFacilityIdAndUnitTypeId(facilityId, unitTypeId)
                    .orElseGet(() -> FacilityUnitTypePrice.builder()
                            .facilityId(facilityId)
                            .unitTypeId(unitTypeId)
                            .build());
            price.setMonthlyPrice(request.getMonthlyPrice());
            priceRepository.save(price);
        }

        Long priceVal = priceRepository.findByFacilityIdAndUnitTypeId(facilityId, ut.getId())
                .map(FacilityUnitTypePrice::getMonthlyPrice)
                .orElse(0L);
        long totalUnits = storageUnitRepository.countByFacilityIdAndUnitTypeId(facilityId, ut.getId());

        return mapper.toUnitTypeResponse(ut, facilityId, priceVal, totalUnits);
    }

    @Override
    public void deactivateUnitType(Long facilityId, Long unitTypeId) {
        UnitType ut = unitTypeRepository.findById(unitTypeId)
                .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));

        long inUseUnits = storageUnitRepository.countByUnitTypeIdAndStatusIn(
                unitTypeId, List.of(StorageUnitStatus.RESERVED, StorageUnitStatus.OCCUPIED));

        if (inUseUnits > 0) {
            throw new CustomException(ErrorCode.UNIT_TYPE_HAS_ACTIVE_UNITS);
        }

        ut.setActive(false);
        unitTypeRepository.save(ut);
    }
}
