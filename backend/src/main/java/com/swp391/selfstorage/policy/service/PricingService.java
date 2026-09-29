package com.swp391.selfstorage.policy.service;

import java.util.List;

import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.PriceVersionResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;

public interface PricingService {

    /**
     * Lấy toàn bộ danh sách đơn giá của các loại kho tại một cơ sở
     */
    List<FacilityPriceResponse> getPricesByFacility(Long facilityId);

    /**
     * Lịch sử phiên bản giá tại cơ sở (mới nhất trước); lọc theo unitTypeId nếu có.
     */
    List<PriceVersionResponse> getPriceHistory(Long facilityId, Long unitTypeId);

    /**
     * Cập nhật đơn giá tháng cho một loại kho tại cơ sở (BM-03)
     */
    FacilityPriceResponse updatePrice(Long facilityId, Long unitTypeId, UpdatePriceRequest request);
}
