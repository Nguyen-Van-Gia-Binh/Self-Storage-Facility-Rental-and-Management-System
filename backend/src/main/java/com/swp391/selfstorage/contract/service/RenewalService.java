package com.swp391.selfstorage.contract.service;

import java.util.List;

import com.swp391.selfstorage.contract.dto.ForceRenewalRequest;
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

    /**
     * 4. Tính toán báo giá xem trước cho FM khi thực hiện Force Renewal (BR-REN-10).
     * Áp dụng trong khoảng T-20 đến T-0 ngày khi khách cũ đến quầy.
     * Tự động cộng phí hành chính 200.000 VNĐ và kiểm tra ô kho chưa bị ai cọc trước.
     */
    RenewalQuoteResponse getForceRenewalQuote(Long contractId, ForceRenewalRequest request);

    /**
     * 5. Xử lý Quản lý cơ sở (FM) duyệt Gia hạn Ngoại lệ tại quầy (Force Renewal - BR-REN-10).
     * Thu tiền mặt hoặc chuyển khoản tại quầy, cập nhật hợp đồng và lưu vết ContractRenewal.
     */
    RenewalResponse processForceRenewal(Long contractId, ForceRenewalRequest request);
}
