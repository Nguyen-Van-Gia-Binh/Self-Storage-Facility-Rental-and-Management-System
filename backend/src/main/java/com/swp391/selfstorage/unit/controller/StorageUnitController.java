package com.swp391.selfstorage.unit.controller;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.unit.dto.BatchCreateStorageUnitsRequest;
import com.swp391.selfstorage.unit.dto.CreateStorageUnitRequest;
import com.swp391.selfstorage.unit.dto.StorageUnitResponse;
import com.swp391.selfstorage.unit.dto.UpdateStorageUnitStatusRequest;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.service.StorageUnitService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/facilities/{facilityId}/storage-units")
public class StorageUnitController {

    private final StorageUnitService storageUnitService;

    public StorageUnitController(StorageUnitService storageUnitService) {
        this.storageUnitService = storageUnitService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<StorageUnitResponse>> getStorageUnits(
            @PathVariable Long facilityId,
            @RequestParam(required = false) Long unitTypeId,
            @RequestParam(required = false) StorageUnitStatus status,
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) Integer rentalMonths,
            @PageableDefault(size = 50) Pageable pageable) {
        PageResponse<StorageUnitResponse> response = storageUnitService.getStorageUnitsByFacility(
                facilityId, unitTypeId, status, floor, position, startDate, rentalMonths, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{unitId}")
    public ResponseEntity<ApiResponse<StorageUnitResponse>> getStorageUnit(
            @PathVariable Long facilityId,
            @PathVariable Long unitId) {
        StorageUnitResponse response = storageUnitService.getStorageUnitById(facilityId, unitId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin ô kho thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StorageUnitResponse>> createStorageUnit(
            @PathVariable Long facilityId,
            @Valid @RequestBody CreateStorageUnitRequest request) {
        StorageUnitResponse response = storageUnitService.createStorageUnit(facilityId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo ô kho thành công"));
    }

    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<StorageUnitResponse>>> batchCreateStorageUnits(
            @PathVariable Long facilityId,
            @Valid @RequestBody BatchCreateStorageUnitsRequest request) {
        List<StorageUnitResponse> response = storageUnitService.batchCreateStorageUnits(facilityId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo hàng loạt ô kho thành công"));
    }

    @PatchMapping("/{unitId}/status")
    public ResponseEntity<ApiResponse<StorageUnitResponse>> updateStorageUnitStatus(
            @PathVariable Long facilityId,
            @PathVariable Long unitId,
            @Valid @RequestBody UpdateStorageUnitStatusRequest request) {
        StorageUnitResponse response = storageUnitService.updateStorageUnitStatus(facilityId, unitId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái ô kho thành công"));
    }
}
