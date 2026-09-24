package com.swp391.selfstorage.unit.mapper;

import com.swp391.selfstorage.unit.dto.StorageUnitResponse;
import com.swp391.selfstorage.unit.dto.UnitTypeResponse;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.UnitType;
import org.springframework.stereotype.Component;

@Component
public class UnitMapper {

    public UnitTypeResponse toUnitTypeResponse(UnitType ut, Long facilityId, Long monthlyPrice, Long totalUnits) {
        if (ut == null) return null;
        return UnitTypeResponse.builder()
                .id(ut.getId())
                .facilityId(facilityId)
                .code(ut.getCode())
                .name(ut.getName())
                .description(ut.getDescription())
                .widthM(ut.getWidthM())
                .depthM(ut.getLengthM())
                .heightM(ut.getHeightM())
                .areaM2(ut.getAreaM2())
                .volumeM3(ut.getVolumeM3())
                .monthlyPrice(monthlyPrice)
                .totalUnits(totalUnits != null ? totalUnits : 0L)
                .isActive(ut.isActive())
                .build();
    }

    public StorageUnitResponse toStorageUnitResponse(StorageUnit su, String unitTypeName) {
        if (su == null) return null;
        return StorageUnitResponse.builder()
                .id(su.getId())
                .facilityId(su.getFacilityId())
                .unitTypeId(su.getUnitTypeId())
                .unitTypeName(unitTypeName)
                .code(su.getCode())
                .floor(su.getFloor())
                .position(su.getPosition())
                .locationNote(su.getLocationNote())
                .status(su.getStatus())
                .isActive(su.isActive())
                .build();
    }

    public StorageUnitResponse toStorageUnitResponse(StorageUnit su, UnitType unitType, Long monthlyPrice) {
        if (su == null) return null;
        return StorageUnitResponse.builder()
                .id(su.getId())
                .facilityId(su.getFacilityId())
                .unitTypeId(su.getUnitTypeId())
                .unitTypeName(unitType != null ? unitType.getName() : null)
                .unitTypeCode(unitType != null ? unitType.getCode() : null)
                .monthlyPrice(monthlyPrice)
                .code(su.getCode())
                .floor(su.getFloor())
                .position(su.getPosition())
                .locationNote(su.getLocationNote())
                .status(su.getStatus())
                .isActive(su.isActive())
                .build();
    }
}
