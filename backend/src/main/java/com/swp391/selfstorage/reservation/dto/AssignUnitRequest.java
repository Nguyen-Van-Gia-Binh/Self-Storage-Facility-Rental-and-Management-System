package com.swp391.selfstorage.reservation.dto;

import jakarta.validation.constraints.NotNull;

/**
 * FM gán hoặc đổi ô kho cho đơn đã thanh toán (BR-AVL-04).
 */
public class AssignUnitRequest {

    @NotNull(message = "Mã ô kho không được để trống")
    private Long storageUnitId;

    public AssignUnitRequest() {}

    public AssignUnitRequest(Long storageUnitId) {
        this.storageUnitId = storageUnitId;
    }

    public Long getStorageUnitId() {
        return storageUnitId;
    }

    public void setStorageUnitId(Long storageUnitId) {
        this.storageUnitId = storageUnitId;
    }
}
