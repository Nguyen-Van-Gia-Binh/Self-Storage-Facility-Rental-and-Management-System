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
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import org.springframework.beans.factory.annotation.Autowired;

@Service
@Transactional(readOnly = true)
public class RenewalServiceImpl implements RenewalService {

    private final RentalContractRepository rentalContractRepository;
    private final ContractRenewalRepository contractRenewalRepository;
    private final ReservationRepository reservationRepository;
    private final FacilityUnitTypePriceRepository facilityPriceRepository;
    private final PolicyService policyService;
    private final RenewalMapper renewalMapper;

    @Autowired(required = false)
    private AppliedPriceLookup appliedPriceLookup;

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

        int bufferDays = activePolicy.getRentalBufferDays() == null ? -1 : activePolicy.getRentalBufferDays();
        if (bufferDays < 0) {
            throw new CustomException(ErrorCode.POLICY_NOT_FOUND, "Chinh sach hieu luc thieu rental_buffer_days");
        }

        if (contract.getStorageUnitId() != null) {
            boolean hasUpcomingReservation = reservationRepository.existsOverlappingReservationForUnit(
                    contract.getStorageUnitId(),
                    contract.getEndDateExclusive(),
                    newEndDate,
                    OffsetDateTime.now(),
                    bufferDays);
            boolean hasOtherContract = rentalContractRepository.existsOverlappingContractForUnit(
                    contract.getStorageUnitId(),
                    contract.getEndDateExclusive(),
                    newEndDate,
                    bufferDays,
                    contract.getId());
            if (hasUpcomingReservation || hasOtherContract) {
                throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE,
                        "Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo. Quý khách vui lòng chọn thuê ô kho mới hoặc lên lịch trả kho.");
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
        if (paymentTransactionId != null) {
            var existing = contractRenewalRepository.findByPaymentTransactionId(paymentTransactionId);
            if (existing.isPresent()) {
                return renewalMapper.toResponse(existing.get());
            }
        }

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
                quote.getTotalAmount(),
                paymentTransactionId);
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

        // Hợp đồng OVERDUE chỉ được gia hạn sau khi đã tất toán toàn bộ nợ phạt (BR-REN-06)
        if (contract.getStatus() == ContractStatus.OVERDUE) {
            if (contract.getOverdueFeeAccrued() > 0) {
                throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED,
                        "Hợp đồng đang có nợ phạt quá hạn. Vui lòng thanh toán nợ phạt trước khi gia hạn.");
            }
            // Nếu overdueFeeAccrued == 0, cho phép tiếp tục gia hạn
        } else if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED,
                    "Chỉ hợp đồng đang hoạt động (ACTIVE) hoặc đã tất toán nợ phạt quá hạn (OVERDUE) mới được phép gia hạn.");
        }

        return contract;
    }

    private long getLatestMonthlyPrice(RentalContract contract) {
        if (appliedPriceLookup != null) {
            return appliedPriceLookup.resolveMonthlyPrice(contract.getFacilityId(), contract.getUnitTypeId())
                    .filter(p -> p > 0)
                    .orElse(contract.getMonthlyPrice());
        }
        return facilityPriceRepository.findByFacilityIdAndUnitTypeId(contract.getFacilityId(), contract.getUnitTypeId())
                .map(FacilityUnitTypePrice::getMonthlyPrice)
                .orElse(contract.getMonthlyPrice());
    }
}
