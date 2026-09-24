package com.swp391.selfstorage.unit.service;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.unit.dto.BatchCreateStorageUnitsRequest;
import com.swp391.selfstorage.unit.dto.CreateStorageUnitRequest;
import com.swp391.selfstorage.unit.dto.StorageUnitResponse;
import com.swp391.selfstorage.unit.dto.UpdateStorageUnitStatusRequest;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StorageUnitService {
    PageResponse<StorageUnitResponse> getStorageUnitsByFacility(Long facilityId, Long unitTypeId, StorageUnitStatus status, Pageable pageable);
    PageResponse<StorageUnitResponse> getStorageUnitsByFacility(Long facilityId, Long unitTypeId, StorageUnitStatus status, Integer floor, String position, Pageable pageable);
    StorageUnitResponse getStorageUnitById(Long facilityId, Long unitId);
    StorageUnitResponse createStorageUnit(Long facilityId, CreateStorageUnitRequest request);
    List<StorageUnitResponse> batchCreateStorageUnits(Long facilityId, BatchCreateStorageUnitsRequest request);
    StorageUnitResponse updateStorageUnitStatus(Long facilityId, Long unitId, UpdateStorageUnitStatusRequest request);
}
