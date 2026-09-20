package com.swp391.selfstorage.policy.service;

import java.util.List;

import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;

public interface PricingService {

    /**
     * Lấy toàn bộ danh sách đơn giá của các loại kho tại một cơ sở
     */
    List<FacilityPriceResponse> getPricesByFacility(Long facilityId);

    /**
     * Cập nhật đơn giá tháng cho một loại kho tại cơ sở (BM-03)
     */
    FacilityPriceResponse updatePrice(Long facilityId, Long unitTypeId, UpdatePriceRequest request);
}
