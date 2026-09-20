package com.swp391.selfstorage.unit.controller;

import com.swp391.selfstorage.common.dto.ApiResponse;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.unit.dto.CreateUnitTypeRequest;
import com.swp391.selfstorage.unit.dto.UnitTypeResponse;
import com.swp391.selfstorage.unit.dto.UpdateUnitTypeRequest;
import com.swp391.selfstorage.unit.service.UnitTypeService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/facilities/{facilityId}/unit-types")
public class UnitTypeController {

    private final UnitTypeService unitTypeService;

    public UnitTypeController(UnitTypeService unitTypeService) {
        this.unitTypeService = unitTypeService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<UnitTypeResponse>> getUnitTypes(
            @PathVariable Long facilityId,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20) Pageable pageable) {
        PageResponse<UnitTypeResponse> response = unitTypeService.getUnitTypesByFacility(facilityId, isActive, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{unitTypeId}")
    public ResponseEntity<ApiResponse<UnitTypeResponse>> getUnitType(
            @PathVariable Long facilityId,
            @PathVariable Long unitTypeId) {
        UnitTypeResponse response = unitTypeService.getUnitTypeById(facilityId, unitTypeId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin loại ô kho thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UnitTypeResponse>> createUnitType(
            @PathVariable Long facilityId,
            @Valid @RequestBody CreateUnitTypeRequest request) {
        UnitTypeResponse response = unitTypeService.createUnitType(facilityId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo loại ô kho thành công"));
    }

    @PutMapping("/{unitTypeId}")
    public ResponseEntity<ApiResponse<UnitTypeResponse>> updateUnitType(
            @PathVariable Long facilityId,
            @PathVariable Long unitTypeId,
            @Valid @RequestBody UpdateUnitTypeRequest request) {
        UnitTypeResponse response = unitTypeService.updateUnitType(facilityId, unitTypeId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật loại ô kho thành công"));
    }

    @DeleteMapping("/{unitTypeId}")
    public ResponseEntity<ApiResponse<Void>> deactivateUnitType(
            @PathVariable Long facilityId,
            @PathVariable Long unitTypeId) {
        unitTypeService.deactivateUnitType(facilityId, unitTypeId);
        return ResponseEntity.ok(ApiResponse.success(null, "Vô hiệu hóa loại ô kho thành công"));
    }
}
