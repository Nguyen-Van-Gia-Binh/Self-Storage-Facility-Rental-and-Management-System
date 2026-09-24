package com.swp391.selfstorage.unit.dto;

import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageUnitResponse {
    private Long id;
    private Long facilityId;
    private Long unitTypeId;
    private String unitTypeName;
    private String unitTypeCode;
    private Long monthlyPrice;
    private String code;
    private Integer floor;
    private String position;
    private String locationNote;
    private StorageUnitStatus status;
    private boolean isActive;
}
