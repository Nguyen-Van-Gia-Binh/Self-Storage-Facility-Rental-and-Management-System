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
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.repository.UserRepository;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.swp391.selfstorage.auth.service.UserPrincipal;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class RenewalServiceImpl implements RenewalService {

    private static final long LATE_ADMIN_FEE = 200_000L; // BR-REN-10 renewal.late_admin_fee

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

    @Autowired(required = false)
    private StorageUnitRepository storageUnitRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

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

        boolean isForce = (payment.getProviderReference() != null && payment.getProviderReference().startsWith("FORCE_"));
        long lateAdminFee = 0L;
        long rentalFeeAmount = paid;
        if (isForce || (paid > getLatestMonthlyPrice(contract) * months)) {
            lateAdminFee = LATE_ADMIN_FEE;
            rentalFeeAmount = Math.max(0L, paid - lateAdminFee);
            isForce = true;
        }
        long monthly = months > 0 ? rentalFeeAmount / months : rentalFeeAmount;

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
                rentalFeeAmount,
                lateAdminFee,
                isForce,
                payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "ONLINE_PAYMENT",
                isForce ? "Gia hạn ngoại lệ T-20 qua cổng Online" : null,
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
        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));
        assertContractOwner(contract);
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
                // Kiểm tra xem cơ sở có còn ô kho khác cùng loại đang khả dụng không
                List<StorageUnit> alternativeUnits = storageUnitRepository != null
                        ? storageUnitRepository.findByFacilityId(contract.getFacilityId()).stream()
                                .filter(u -> u.getUnitTypeId().equals(contract.getUnitTypeId())
                                        && !u.getId().equals(contract.getStorageUnitId())
                                        && (u.getStatus() == StorageUnitStatus.AVAILABLE)
                                        && !reservationRepository.existsOverlappingReservationForUnit(
                                                u.getId(), contract.getEndDateExclusive(), newEndDate, OffsetDateTime.now(), bufferDays, 0L)
                                        && !rentalContractRepository.existsOverlappingContractForUnit(
                                                u.getId(), contract.getEndDateExclusive(), newEndDate, bufferDays, 0L))
                                .toList()
                        : Collections.emptyList();

                if (alternativeUnits.isEmpty()) {
                    // Trừ khi đã hết sạch ô cùng loại mới hiện lỗi Hard Lock theo đúng BR-REN-10
                    throw new CustomException(ErrorCode.CAPACITY_NOT_AVAILABLE,
                            "Toàn bộ ô kho cùng loại tại cơ sở đã kín chỗ. Không còn ô trống thay thế để điều chuyển đơn đặt cọc của khách mới!");
                }

                // Nếu còn ô trống cùng loại, tìm chi tiết đơn cọc đang xung đột để hiển thị cho FM
                List<Reservation> overlappingReservations = reservationRepository.findOverlappingReservationsForUnit(
                        contract.getStorageUnitId(),
                        contract.getEndDateExclusive(),
                        newEndDate,
                        OffsetDateTime.now(),
                        bufferDays,
                        0L);

                Reservation conflictRes = !overlappingReservations.isEmpty() ? overlappingReservations.get(0) : null;
                String customerName = "Khách hàng mới";
                String customerPhone = "";
                if (conflictRes != null && userRepository != null) {
                    AppUser u = userRepository.findById(conflictRes.getCustomerId()).orElse(null);
                    if (u != null) {
                        customerName = u.getFullName();
                        customerPhone = u.getPhone();
                    }
                }

                long monthlyPrice = getLatestMonthlyPrice(contract);
                long rentalFeeAmount = monthlyPrice * months;
                long lateAdminFee = LATE_ADMIN_FEE;
                long totalAmount = rentalFeeAmount + lateAdminFee;

                RenewalQuoteResponse quote = renewalMapper.toQuoteResponse(
                        contract, months, newEndDate, monthlyPrice,
                        rentalFeeAmount, lateAdminFee, true, 0L, totalAmount, activePolicy.getId());

                quote.setHasCapacityConflict(true);
                quote.setCanReassignAlternative(true);
                if (conflictRes != null) {
                    quote.setConflictingReservationId(conflictRes.getId());
                    quote.setConflictingReservationCode(conflictRes.getCode());
                    quote.setConflictingCustomerName(customerName);
                    quote.setConflictingCustomerPhone(customerPhone);
                    quote.setConflictingStartDate(conflictRes.getStartDate());
                }
                quote.setAlternativeUnitId(alternativeUnits.get(0).getId());
                quote.setAlternativeUnitCode(alternativeUnits.get(0).getCode());
                quote.setAlternativeAvailableUnits(alternativeUnits.stream().map(StorageUnit::getCode).toList());
                quote.setConflictMessage("Ô kho đang được phân bổ cho đơn đặt cọc " 
                        + (conflictRes != null ? conflictRes.getCode() : "") 
                        + " của khách " + customerName + ". Cơ sở vẫn còn " + alternativeUnits.size() 
                        + " ô trống cùng loại (" + quote.getAlternativeUnitCode() + ").");

                return quote;
            }
        }

        long monthlyPrice = getLatestMonthlyPrice(contract);
        long rentalFeeAmount = monthlyPrice * months;
        long lateAdminFee = LATE_ADMIN_FEE; // renewal.late_admin_fee theo BR-REN-10
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

        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH";

        // Khách thanh toán trực tuyến qua cổng (VNPAY / ONLINE) theo lệnh FM duyệt cấp
        if ("VNPAY".equalsIgnoreCase(paymentMethod) || "ONLINE".equalsIgnoreCase(paymentMethod)) {
            paymentTransactionRepository.findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contractId, "CONTRACT_RENEWAL")
                    .ifPresent(existing -> {
                        if ("PENDING".equalsIgnoreCase(existing.getStatus())) {
                            existing.setStatus("FAILED");
                            paymentTransactionRepository.save(existing);
                        }
                    });

            Long orderCode = Long.parseLong(String.valueOf(System.currentTimeMillis()).substring(2)
                    + String.format("%02d", (int) (Math.random() * 100)));

            PaymentTransaction payment = PaymentTransaction.builder()
                    .contractId(contractId)
                    .transactionType("CONTRACT_RENEWAL")
                    .amount(quote.getTotalAmount())
                    .status("PENDING")
                    .paymentMethod("VNPAY")
                    .orderCode(orderCode)
                    .providerReference("FORCE_GH" + contractId + "T" + months)
                    .renewalMonths(months)
                    .build();

            paymentTransactionRepository.save(payment);

            return RenewalResponse.builder()
                    .contractId(contractId)
                    .previousEndDate(previousEnd)
                    .newEndDate(newEnd)
                    .renewalMonths(months)
                    .monthlyPriceSnapshot(quote.getMonthlyPriceSnapshot())
                    .rentalFeeAmount(quote.getRentalFeeAmount())
                    .lateAdminFee(quote.getLateAdminFee())
                    .totalPaid(quote.getTotalAmount())
                    .isForceRenewal(true)
                    .paymentMethod("VNPAY")
                    .notes(request.getNotes() != null && !request.getNotes().isBlank()
                            ? request.getNotes()
                            : "FM duyệt cấp cổng thanh toán Online gia hạn ngoại lệ T-20")
                    .build();
        }

        contract.setEndDateExclusive(newEnd);
        contract.setRentalMonths(contract.getRentalMonths() + months);
        rentalContractRepository.save(contract);

        long policyVersionId = contract.getPolicyVersionId() == null ? 1L : contract.getPolicyVersionId();

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

        assertContractOwner(contract);

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
                    "Hợp đồng đã quá hạn không thể gia hạn (máy trạng thái một chiều). Quý khách vui lòng thanh toán phí quá hạn để nhận mã PIN tạm và làm thủ tục trả kho.");
        } else if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new CustomException(ErrorCode.RENEWAL_NOT_ALLOWED,
                    "Chỉ hợp đồng đang hoạt động (ACTIVE) mới được phép tự gia hạn trực tuyến.");
        }

        return contract;
    }

    private void assertContractOwner(RentalContract contract) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal user) {
            if (user.getRole() == UserRole.STORAGE_CUSTOMER
                    && !java.util.Objects.equals(contract.getCustomerId(), user.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED,
                        "Bạn không có quyền truy cập thông tin gia hạn của hợp đồng này");
            }
        }
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

    /**
     * 6. FM điều chuyển đơn đặt cọc mới sang ô kho trống khác cùng loại để giải phóng ô cho khách cũ Force Renewal (FM-02, BR-REN-10).
     */
    @Override
    @Transactional
    public void reassignConflictingReservation(Long contractId, Long reservationId, Long targetStorageUnitId) {
        Reservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND, "Không tìm thấy đơn đặt cọc"));
        if (storageUnitRepository == null) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR, "StorageUnitRepository chưa được khởi tạo");
        }
        StorageUnit targetUnit = storageUnitRepository.findById(targetStorageUnitId)
                .orElseThrow(() -> new CustomException(ErrorCode.STORAGE_UNIT_NOT_FOUND, "Không tìm thấy ô kho thay thế"));

        if (!targetUnit.getUnitTypeId().equals(res.getUnitTypeId())) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ô kho thay thế phải cùng loại kho");
        }
        if (targetUnit.getStatus() != StorageUnitStatus.AVAILABLE) {
            throw new CustomException(ErrorCode.UNIT_NOT_AVAILABLE, "Ô kho thay thế không ở trạng thái AVAILABLE");
        }

        Long previousUnitId = res.getStorageUnitId();
        res.setStorageUnitId(targetStorageUnitId);
        reservationRepository.save(res);

        targetUnit.setStatus(StorageUnitStatus.RESERVED);
        storageUnitRepository.save(targetUnit);

        if (previousUnitId != null && !previousUnitId.equals(targetStorageUnitId)) {
            storageUnitRepository.findById(previousUnitId).ifPresent(prev -> {
                prev.setStatus(StorageUnitStatus.AVAILABLE);
                storageUnitRepository.save(prev);
            });
        }
    }
}
