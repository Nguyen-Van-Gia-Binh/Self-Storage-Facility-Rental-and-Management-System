package com.swp391.selfstorage.contract.service.impl;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.ForceRenewalRequest;
import com.swp391.selfstorage.contract.dto.RenewalQuoteResponse;
import com.swp391.selfstorage.contract.dto.RenewalRequest;
import com.swp391.selfstorage.contract.dto.RenewalResponse;
import com.swp391.selfstorage.contract.entity.ContractRenewal;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.mapper.RenewalMapper;
import com.swp391.selfstorage.contract.repository.ContractRenewalRepository;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.contract.service.RenewalService;
import com.swp391.selfstorage.policy.dto.PolicyResponse;
import com.swp391.selfstorage.policy.service.PolicyService;
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.policy.service.AppliedPriceLookup;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.FacilityUnitTypePriceRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RenewalServiceImpl implements RenewalService {

    private final RentalContractRepository rentalContractRepository;
    private final ContractRenewalRepository contractRenewalRepository;
    private final ReservationRepository reservationRepository;
    private final FacilityUnitTypePriceRepository facilityPriceRepository;
    private final PolicyService policyService;
    private final RenewalMapper renewalMapper;
    private final UnitTypeRepository unitTypeRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    @Autowired(required = false)
    private AppliedPriceLookup appliedPriceLookup;

    /**
     * 1. Tính toán báo giá xem trước cho khách hàng trước khi thanh toán (Quote).
     */
    @Override
    public RenewalQuoteResponse getRenewalQuote(Long contractId, RenewalRequest request) {
        RentalContract contract = getValidContractForRenewal(contractId);
        int months = request.getRenewalMonths();

        // BR-REN-01: Khóa tự gia hạn khi đã qua mốc T-20 (< 20 ngày trước ngày hết hạn)
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        if (contract.getEndDateExclusive() != null && contract.getStatus() == ContractStatus.ACTIVE) {
            long daysUntilEnd = ChronoUnit.DAYS.between(today, contract.getEndDateExclusive());
            if (daysUntilEnd < 20) {
                throw new CustomException(ErrorCode.RENEWAL_DEADLINE_PASSED);
            }
        }

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

        // shortcut: callback không kiểm tra trùng chỗ lại, checkout đã chặn; kiểm tra lại khi gia hạn có thể mất chỗ sau khi đã trả tiền
        if (paymentTransactionId == null) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Thiếu giao dịch thanh toán gia hạn");
        }
        PaymentTransaction payment = paymentTransactionRepository.findById(paymentTransactionId)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));
        RentalContract contract = getValidContractForRenewal(contractId);
        int months = payment.getRenewalMonths() != null && payment.getRenewalMonths() > 0
                ? payment.getRenewalMonths()
                : request.getRenewalMonths();
        long paid = payment.getAmount() == null ? 0L : payment.getAmount();
        long monthly = months > 0 ? paid / months : paid;

        LocalDate previousEnd = contract.getEndDateExclusive();
        LocalDate newEnd = previousEnd.plusMonths(months);
        contract.setEndDateExclusive(newEnd);
        contract.setRentalMonths(contract.getRentalMonths() + months);

        rentalContractRepository.save(contract);

        long policyVersionId = contract.getPolicyVersionId() == null ? 1L : contract.getPolicyVersionId();
        ContractRenewal renewal = renewalMapper.toEntity(
                contractId,
                previousEnd,
                newEnd,
                months,
                monthly,
                policyVersionId,
                0L,
                paid,
                paid,
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

    /**
     * 4. Tính toán báo giá xem trước cho FM khi duyệt Force Renewal tại quầy (BR-REN-10).
     */
    @Override
    public RenewalQuoteResponse getForceRenewalQuote(Long contractId, ForceRenewalRequest request) {
        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        if (contract.getStatus() == ContractStatus.OVERDUE) {
            throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED,
                    "Hợp đồng đã quá hạn không thể gia hạn. Vui lòng xử lý theo quy trình nợ quá hạn và tất toán kho.");
        } else if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED,
                    "Chỉ hợp đồng đang hoạt động (ACTIVE) mới được phép gia hạn ngoại lệ.");
        }

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        if (contract.getEndDateExclusive() != null) {
            long daysUntilEnd = ChronoUnit.DAYS.between(today, contract.getEndDateExclusive());
            if (daysUntilEnd < 0) {
                throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED,
                        "Hợp đồng đã quá hạn không thể gia hạn.");
            } else if (daysUntilEnd >= 20) {
                throw new CustomException(ErrorCode.VALIDATION_FAILED,
                        "Hợp đồng còn trên 20 ngày, khách hàng có thể tự gia hạn trực tuyến trên cổng khách hàng.");
            }
        }

        int months = request.getRenewalMonths();
        PolicyResponse activePolicy = policyService.getActivePolicy();
        if (months < activePolicy.getRenewalMinMonths() || months > activePolicy.getRenewalMaxMonths()) {
            throw new CustomException(ErrorCode.RENEWAL_MONTHS_INVALID);
        }

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
                        "Ô kho này đã có khách hàng khác đặt cọc trước cho chu kỳ tiếp theo. Không thể thực hiện gia hạn ngoại lệ!");
            }
        }

        long monthlyPrice = getLatestMonthlyPrice(contract);
        long rentalFeeAmount = monthlyPrice * months;
        long lateAdminFee = 200000L; // renewal.late_admin_fee theo BR-REN-10
        long totalAmount = rentalFeeAmount + lateAdminFee;

        return renewalMapper.toQuoteResponse(
                contract, months, newEndDate, monthlyPrice,
                rentalFeeAmount, lateAdminFee, true, 0L, totalAmount, activePolicy.getId());
    }

    /**
     * 5. Quản lý cơ sở (FM) duyệt Gia hạn Ngoại lệ tại quầy sau khi thu tiền (BR-REN-10).
     */
    @Override
    @Transactional
    public RenewalResponse processForceRenewal(Long contractId, ForceRenewalRequest request) {
        RenewalQuoteResponse quote = getForceRenewalQuote(contractId, request);
        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        int months = request.getRenewalMonths();
        LocalDate previousEnd = contract.getEndDateExclusive();
        LocalDate newEnd = quote.getNewEndDate();

        contract.setEndDateExclusive(newEnd);
        contract.setRentalMonths(contract.getRentalMonths() + months);
        rentalContractRepository.save(contract);

        long policyVersionId = contract.getPolicyVersionId() == null ? 1L : contract.getPolicyVersionId();
        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH";

        ContractRenewal renewal = renewalMapper.toEntity(
                contractId,
                previousEnd,
                newEnd,
                months,
                quote.getMonthlyPriceSnapshot(),
                policyVersionId,
                0L,
                quote.getRentalFeeAmount(),
                quote.getLateAdminFee(),
                true,
                paymentMethod,
                request.getNotes(),
                quote.getTotalAmount(),
                null);

        ContractRenewal savedRenewal = contractRenewalRepository.save(renewal);
        return renewalMapper.toResponse(savedRenewal);
    }

    private RentalContract getValidContractForRenewal(Long contractId) {
        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        // CAT-04 / BR-BOM-04: Chặn gia hạn nếu loại kho đã bị BOM chuyển sang INACTIVE
        if (unitTypeRepository != null && contract.getUnitTypeId() != null) {
            UnitType unitType = unitTypeRepository.findById(contract.getUnitTypeId())
                    .orElseThrow(() -> new CustomException(ErrorCode.UNIT_TYPE_NOT_FOUND));
            if (!unitType.isActive()) {
                throw new CustomException(ErrorCode.UNIT_TYPE_INACTIVE);
            }
        }

        // BR-REN-02, BR-REN-06: Hợp đồng đã quá hạn (OVERDUE) bị khóa tự gia hạn trực tuyến (máy trạng thái một chiều).
        // Muốn xin gia hạn ngoại lệ bắt buộc phải liên hệ Quản lý cơ sở (FM).
        if (contract.getStatus() == ContractStatus.OVERDUE) {
            throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED,
                    "Hợp đồng đã quá hạn không thể tự gia hạn trực tuyến. Vui lòng liên hệ Quản lý cơ sở (FM) hoặc hoàn tất thủ tục trả kho.");
        } else if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED,
                    "Chỉ hợp đồng đang hoạt động (ACTIVE) mới được phép tự gia hạn trực tuyến.");
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
