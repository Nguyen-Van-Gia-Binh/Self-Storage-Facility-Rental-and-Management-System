package com.swp391.selfstorage.contract.service;

import java.util.List;

import com.swp391.selfstorage.contract.dto.RenewalQuoteResponse;
import com.swp391.selfstorage.contract.dto.RenewalRequest;
import com.swp391.selfstorage.contract.dto.RenewalResponse;

public interface RenewalService {

    /**
     * 1. Tính toán báo giá xem trước cho khách hàng trước khi thanh toán (Quote).
     * Kiểm tra điều kiện hợp đồng, số tháng hợp lệ, ô kho còn trống và lấy giá hiện
     * hành.
     */
    RenewalQuoteResponse getRenewalQuote(Long contractId, RenewalRequest request);

    /**
     * 2. Xử lý gia hạn hợp đồng sau khi có xác nhận thanh toán thành công.
     * Cập nhật ngày kết thúc hợp đồng, chuyển OVERDUE -> ACTIVE, và ghi nhận
     * ContractRenewal.
     */
    RenewalResponse processRenewal(Long contractId, RenewalRequest request, Long paymentTransactionId);

    /**
     * 3. Tra cứu lịch sử các lần gia hạn của hợp đồng.
     */
    List<RenewalResponse> getRenewalHistory(Long contractId);
}
