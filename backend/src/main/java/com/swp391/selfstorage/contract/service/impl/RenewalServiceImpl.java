package com.swp391.selfstorage.contract.service.impl;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.RenewalQuoteResponse;
import com.swp391.selfstorage.contract.dto.RenewalRequest;
import com.swp391.selfstorage.contract.dto.RenewalResponse;
import com.swp391.selfstorage.contract.entity.ContractRenewal;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.mapper.RenewalMapper;
import com.swp391.selfstorage.contract.repository.ContractRenewalRepository;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.service.RenewalService;
import com.swp391.selfstorage.policy.dto.PolicyResponse;
import com.swp391.selfstorage.policy.service.PolicyService;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;

@Service
@Transactional(readOnly = true)
public class RenewalServiceImpl implements RenewalService {

    private final RentalContractRepository rentalContractRepository;
    private final ContractRenewalRepository contractRenewalRepository;
    private final ReservationRepository reservationRepository;
    private final FacilityUnitTypePriceRepository facilityPriceRepository;
    private final PolicyService policyService;
    private final RenewalMapper renewalMapper;

    public RenewalServiceImpl(RentalContractRepository rentalContractRepository,
            ContractRenewalRepository contractRenewalRepository,
            ReservationRepository reservationRepository,
            FacilityUnitTypePriceRepository facilityPriceRepository,
            PolicyService policyService,
            RenewalMapper renewalMapper) {
        this.rentalContractRepository = rentalContractRepository;
        this.contractRenewalRepository = contractRenewalRepository;
        this.reservationRepository = reservationRepository;
        this.facilityPriceRepository = facilityPriceRepository;
        this.policyService = policyService;
        this.renewalMapper = renewalMapper;
    }

    /**
     * 1. Tính toán báo giá xem trước cho khách hàng trước khi thanh toán (Quote).
     */
    @Override
    public RenewalQuoteResponse getRenewalQuote(Long contractId, RenewalRequest request) {
        RentalContract contract = getValidContractForRenewal(contractId);
        int months = request.getRenewalMonths();

        // 1. Kiểm tra chính sách hiện hành
        PolicyResponse activePolicy = policyService.getActivePolicy();
        if (months < activePolicy.getRenewalMinMonths() || months > activePolicy.getRenewalMaxMonths()) {
            throw new CustomException(ErrorCode.RENEWAL_MONTHS_INVALID);
        }

        // 2. Tính toán ngày kết thúc mới
        LocalDate newEndDate = contract.getEndDateExclusive().plusMonths(months);

        // 3. Kiểm tra Capacity ô kho cho kỳ gia hạn mới (BR-REN-09, BR-AVL-01)
        if (contract.getStorageUnitId() != null) {
            boolean hasUpcomingReservation = reservationRepository.existsOverlappingReservationForUnit(
                    contract.getStorageUnitId(),
                    contract.getEndDateExclusive(),
                    newEndDate,
                    OffsetDateTime.now());
            if (hasUpcomingReservation) {
                throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE);
            }
        }

        // 4. Lấy đơn giá thuê tháng hiện tại (Snapshot giá theo BR-REN-05)
        long monthlyPrice = getLatestMonthlyPrice(contract);

        // 5. Tính toán tài chính
        long rentalFeeAmount = monthlyPrice * months;
        long overdueFee = (contract.getStatus() == ContractStatus.OVERDUE) ? contract.getOverdueFeeAccrued() : 0L;
        long totalAmount = rentalFeeAmount + overdueFee;

        return renewalMapper.toQuoteResponse(
                contract, months, newEndDate, monthlyPrice,
                rentalFeeAmount, overdueFee, totalAmount, activePolicy.getId());
    }

    /**
     * 2. Xử lý gia hạn hợp đồng sau khi có xác nhận thanh toán thành công.
     */
    @Override
    @Transactional
    public RenewalResponse processRenewal(Long contractId, RenewalRequest request, Long paymentTransactionId) {
        RenewalQuoteResponse quote = getRenewalQuote(contractId, request);
        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        // 1. Cập nhật thông tin Hợp đồng
        contract.setEndDateExclusive(quote.getNewEndDate());
        contract.setRentalMonths(contract.getRentalMonths() + quote.getRenewalMonths());

        // Nếu hợp đồng đang quá hạn, khôi phục lại ACTIVE và xóa nợ phạt (BR-REN-06)
        if (contract.getStatus() == ContractStatus.OVERDUE) {
            contract.setStatus(ContractStatus.ACTIVE);
            contract.setOverdueFeeAccrued(0L);
        }
        rentalContractRepository.save(contract);

        // 2. Lưu bản ghi lịch sử gia hạn ContractRenewal
        ContractRenewal renewal = renewalMapper.toEntity(
                contractId,
                quote.getPreviousEndDate(),
                quote.getNewEndDate(),
                quote.getRenewalMonths(),
                quote.getMonthlyPriceSnapshot(),
                quote.getPolicyVersionId(),
                quote.getOverdueFeeSettled(),
                quote.getRentalFeeAmount(),
                quote.getTotalAmount());
        ContractRenewal savedRenewal = contractRenewalRepository.save(renewal);

        return renewalMapper.toResponse(savedRenewal);
    }

    /**
     * 3. Tra cứu lịch sử các lần gia hạn của hợp đồng.
     */
    @Override
    public List<RenewalResponse> getRenewalHistory(Long contractId) {
        if (!rentalContractRepository.existsById(contractId)) {
            throw new CustomException(ErrorCode.CONTRACT_NOT_FOUND);
        }
        return contractRenewalRepository.findByContractIdOrderByCreatedAtDesc(contractId)
                .stream()
                .map(renewalMapper::toResponse)
                .toList();
    }

    private RentalContract getValidContractForRenewal(Long contractId) {
        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        // Hợp đồng chỉ được gia hạn khi ACTIVE hoặc OVERDUE (BR-REN-02, BR-REN-06)
        if (contract.getStatus() != ContractStatus.ACTIVE && contract.getStatus() != ContractStatus.OVERDUE) {
            throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED);
        }

        return contract;
    }

    private long getLatestMonthlyPrice(RentalContract contract) {
        return facilityPriceRepository.findByFacilityIdAndUnitTypeId(contract.getFacilityId(), contract.getUnitTypeId())
                .map(FacilityUnitTypePrice::getMonthlyPrice)
                .orElse(contract.getMonthlyPrice());
    }
}
