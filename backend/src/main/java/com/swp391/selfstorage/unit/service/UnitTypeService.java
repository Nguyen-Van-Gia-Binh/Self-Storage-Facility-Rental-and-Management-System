package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.unit.dto.CreateUnitTypeRequest;
import com.swp391.selfstorage.unit.dto.UnitTypeResponse;
import com.swp391.selfstorage.unit.dto.UpdateUnitTypeRequest;
import org.springframework.data.domain.Pageable;

public interface UnitTypeService {
    PageResponse<UnitTypeResponse> getUnitTypesByFacility(Long facilityId, Boolean isActive, Pageable pageable);
    UnitTypeResponse getUnitTypeById(Long facilityId, Long unitTypeId);
    UnitTypeResponse createUnitType(Long facilityId, CreateUnitTypeRequest request);
    UnitTypeResponse updateUnitType(Long facilityId, Long unitTypeId, UpdateUnitTypeRequest request);
    void deactivateUnitType(Long facilityId, Long unitTypeId);
    UnitTypeResponse updateUnitTypeStatus(Long facilityId, Long unitTypeId, boolean isActive);
}
