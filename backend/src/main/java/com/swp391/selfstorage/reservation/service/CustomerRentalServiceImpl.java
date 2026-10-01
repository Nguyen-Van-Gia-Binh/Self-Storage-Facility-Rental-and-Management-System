package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.repository.ReturnRequestRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.contract.repository.HandoverRecordRepository;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import com.swp391.selfstorage.reservation.dto.CustomerRentalDetailResponse;
import com.swp391.selfstorage.reservation.dto.CustomerRentalSummaryResponse;
import com.swp391.selfstorage.reservation.dto.AccessLogResponse;
import com.swp391.selfstorage.reservation.dto.ChangePinRequest;
import com.swp391.selfstorage.reservation.entity.AccessLog;
import com.swp391.selfstorage.reservation.repository.AccessLogRepository;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.PolicyNumbers;
import com.swp391.selfstorage.reservation.entity.Reservation;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CustomerRentalServiceImpl implements CustomerRentalService {

    private final RentalContractRepository rentalContractRepository;
    private final ReservationRepository reservationRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FacilityRepository facilityRepository;
    private final UnitTypeRepository unitTypeRepository;
    private final AccessLogRepository accessLogRepository;
    private final ReturnRequestRepository returnRequestRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PolicyVersionRepository policyVersionRepository;
    private final UserRepository userRepository;
    private final HandoverRecordRepository handoverRecordRepository;
    private final SupportRequestRepository supportRequestRepository;

    public CustomerRentalServiceImpl(
            RentalContractRepository rentalContractRepository,
            ReservationRepository reservationRepository,
            StorageUnitRepository storageUnitRepository,
            FacilityRepository facilityRepository,
            UnitTypeRepository unitTypeRepository,
            AccessLogRepository accessLogRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) ReturnRequestRepository returnRequestRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) PaymentTransactionRepository paymentTransactionRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) PolicyVersionRepository policyVersionRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) UserRepository userRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) HandoverRecordRepository handoverRecordRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) SupportRequestRepository supportRequestRepository
    ) {
        this.rentalContractRepository = rentalContractRepository;
        this.reservationRepository = reservationRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.facilityRepository = facilityRepository;
        this.unitTypeRepository = unitTypeRepository;
        this.accessLogRepository = accessLogRepository;
        this.returnRequestRepository = returnRequestRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.policyVersionRepository = policyVersionRepository;
        this.userRepository = userRepository;
        this.handoverRecordRepository = handoverRecordRepository;
        this.supportRequestRepository = supportRequestRepository;
    }

    private int activeHoldHours() {
        if (policyVersionRepository == null) {
            return 48;
        }
        return policyVersionRepository
                .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(java.time.OffsetDateTime.now())
                .map(PolicyVersion::getReservationHoldHours)
                .filter(hours -> hours != null && hours > 0)
                .orElse(48);
    }


    @Override
    public PageResponse<CustomerRentalSummaryResponse> getMyRentals(
            UserPrincipal currentUser,
            String statusFilter,
            Pageable pageable
    ) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        Long customerId = currentUser.getId();
        Page<RentalContract> contractPage;

        if (statusFilter == null || statusFilter.isBlank() || statusFilter.equalsIgnoreCase("ALL")) {
            contractPage = rentalContractRepository.findByCustomerIdAndStatusNot(
                    customerId, ContractStatus.CANCELLED, pageable);
        } else if (statusFilter.equalsIgnoreCase("ACTIVE")) {
            contractPage = rentalContractRepository.findByCustomerIdAndStatus(customerId, ContractStatus.ACTIVE, pageable);
        } else if (statusFilter.equalsIgnoreCase("OVERDUE")) {
            contractPage = rentalContractRepository.findByCustomerIdAndStatus(customerId, ContractStatus.OVERDUE, pageable);
        } else if (statusFilter.equalsIgnoreCase("HISTORY")) {
            contractPage = rentalContractRepository.findByCustomerIdAndStatusIn(
                    customerId,
                    List.of(ContractStatus.CLOSED, ContractStatus.TERMINATED),
                    pageable
            );
        } else {
            try {
                ContractStatus parsed = ContractStatus.valueOf(statusFilter.toUpperCase());
                contractPage = rentalContractRepository.findByCustomerIdAndStatus(customerId, parsed, pageable);
            } catch (IllegalArgumentException e) {
                contractPage = rentalContractRepository.findByCustomerId(customerId, pageable);
            }
        }

        List<CustomerRentalSummaryResponse> dtos = contractPage.getContent().stream()
                .map(this::mapToSummaryResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                dtos,
                contractPage.getNumber(),
                contractPage.getSize(),
                contractPage.getTotalElements(),
                contractPage.getTotalPages()
        );
    }

    @Override
    public CustomerRentalDetailResponse getMyRentalDetail(Long contractId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        if (currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
            if (!contract.getCustomerId().equals(currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
        }

        CustomerRentalDetailResponse detail = new CustomerRentalDetailResponse();
        populateSummaryFields(detail, contract);

        detail.setCreatedAt(contract.getCreatedAt());
        detail.setCheckinDate(contract.getCheckinDate());
        detail.setReturnDate(contract.getReturnDate());
        detail.setClosedAt(contract.getClosedAt());
        detail.setTotalRentalFee(contract.getTotalRentalFee());
        detail.setPolicySnapshot(contract.getPolicySnapshot());

        // Điền thông tin khách hàng phục vụ xem hợp đồng điện tử
        if (contract.getCustomerId() != null && userRepository != null) {
            userRepository.findById(contract.getCustomerId()).ifPresent(u -> {
                detail.setCustomerName(u.getFullName());
                detail.setCustomerPhone(u.getPhone());
                detail.setCustomerEmail(u.getEmail());
                detail.setCustomerIdentityNumber(u.getIdentityNumber());
            });
        }

        // Điền thông tin bàn giao thực tế (Handover Record)
        if (handoverRecordRepository != null) {
            handoverRecordRepository.findTopByContractIdAndRejectedFalseOrderByHandoverAtDesc(contract.getId())
                    .ifPresent(hr -> {
                        detail.setHandoverConditionNote(hr.getConditionNote());
                        detail.setCustomerConfirmedAt(hr.getCustomerConfirmedAt());
                        if (hr.getStaffId() != null && userRepository != null) {
                            userRepository.findById(hr.getStaffId()).ifPresent(staff -> {
                                detail.setHandoverStaffName(staff.getFullName());
                            });
                        }
                    });
        }

        // Điền thông tin phụ lục điều chuyển kho do sự cố kỹ thuật (nếu có)
        if (contract.getRelocationSupportRequestId() != null) {
            detail.setRelocationSupportRequestId(contract.getRelocationSupportRequestId());
            if (supportRequestRepository != null) {
                supportRequestRepository.findById(contract.getRelocationSupportRequestId())
                        .ifPresent(ticket -> {
                            detail.setRelocationSupportRequestCode(ticket.getCode());
                            detail.setRelocationReason(ticket.getDescription());
                        });
            }
        }

        // Hướng dẫn mở cửa kho
        if (contract.getStatus() == ContractStatus.OVERDUE) {
            if (detail.isAccessCodeLocked()) {
                detail.setInstructionNotes("Mã PIN của quý khách hiện đang tạm khóa an ninh từ mốc D+7 do hợp đồng quá hạn. Vui lòng thanh toán khoản nợ phạt để mở khóa quyền truy cập.");
            } else if (detail.getOverdueDays() >= 4 && detail.getOverdueDays() < 7) {
                detail.setInstructionNotes("Hợp đồng đã quá hạn " + detail.getOverdueDays() + " ngày và đang phát sinh phí phạt. Quý khách vui lòng dọn đồ hoặc thanh toán nợ phạt sớm trước mốc D+7 để tránh bị khóa mã cửa.");
            } else if (detail.getOverdueDays() <= 3) {
                detail.setInstructionNotes("Hợp đồng đang trong thời gian ân hạn quá hạn 3 ngày. Quý khách vui lòng dọn đồ hoặc gia hạn/thanh toán sớm.");
            } else {
                detail.setInstructionNotes("Hợp đồng đã quá hạn nhưng đã tất toán nợ phạt. Quý khách vui lòng hoàn tất dọn đồ hoặc gia hạn hợp đồng.");
            }
        } else if (detail.isAccessCodeLocked()) {
            detail.setInstructionNotes("Mã PIN của quý khách hiện đang tạm khóa an ninh từ mốc D+7 do hợp đồng quá hạn. Vui lòng thanh toán khoản nợ phạt để mở khóa quyền truy cập.");
        } else if (contract.getStatus() == ContractStatus.ACTIVE) {
            detail.setInstructionNotes("Để mở khóa điện tử, quý khách vui lòng nhập mã PIN 6 số tại bảng điều khiển cửa kho rồi bấm phím #.");
        } else if (contract.getStatus() == ContractStatus.PENDING_RETURN) {
            if (detail.isInspectionDone()) {
                detail.setInstructionNotes("Nhân viên cơ sở đã hoàn tất biên bản nghiệm thu trả kho. Hồ sơ đang được chuyển tới Quản lý cơ sở để duyệt quyết toán hoàn cọc.");
            } else {
                detail.setInstructionNotes("Hợp đồng đang chờ nhân viên cơ sở nghiệm thu trả kho. Quý khách vui lòng dọn sạch đồ đạc và sử dụng mã PIN để ra vào kho.");
            }
        } else if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN) {
            detail.setInstructionNotes("Quý khách vui lòng đến cơ sở để hoàn tất thủ tục bàn giao và nhận mã PIN mở khóa kho.");
        } else {
            detail.setInstructionNotes("Hợp đồng đã kết thúc hoặc thanh lý.");
        }

        // Các hành động khả dụng (allowed actions)
        List<String> actions = new ArrayList<>();
        if (contract.getStatus() == ContractStatus.ACTIVE) {
            actions.add("RENEW");
            actions.add("RETURN_NOTICE");
            actions.add("SUPPORT_TICKET");
        } else if (contract.getStatus() == ContractStatus.PENDING_RETURN) {
            actions.add("VIEW_RETURN_STATUS");
            actions.add("SUPPORT_TICKET");
        } else if (contract.getStatus() == ContractStatus.OVERDUE) {
            actions.add("PAY_DEBT");
            actions.add("SUPPORT_TICKET");
        } else if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN) {
            actions.add("CHECK_IN_INFO");
            actions.add("RESCHEDULE");
        } else if (contract.getStatus() == ContractStatus.CLOSED || contract.getStatus() == ContractStatus.TERMINATED) {
            actions.add("VIEW_INSPECTION");
        }
        detail.setAllowedActions(actions);

        return detail;
    }

    private CustomerRentalSummaryResponse mapToSummaryResponse(RentalContract contract) {
        CustomerRentalSummaryResponse res = new CustomerRentalSummaryResponse();
        populateSummaryFields(res, contract);
        return res;
    }

    private void populateSummaryFields(CustomerRentalSummaryResponse res, RentalContract contract) {
        res.setContractId(contract.getId());
        res.setContractCode(contract.getCode());
        res.setReservationId(contract.getReservationId());

        if (contract.getReservationId() != null && reservationRepository != null) {
            reservationRepository.findById(contract.getReservationId())
                    .ifPresent(r -> res.setReservationCode(r.getCode()));
        }

        // Cơ sở
        res.setFacilityId(contract.getFacilityId());
        if (facilityRepository != null) {
            facilityRepository.findById(contract.getFacilityId()).ifPresent(f -> {
                res.setFacilityName(f.getName());
                res.setFacilityAddress(f.getAddress());
                res.setFacilityPhone(f.getPhone());
            });
        }

        // Ô kho
        res.setStorageUnitId(contract.getStorageUnitId());
        if (storageUnitRepository != null) {
            storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(u -> {
                res.setStorageUnitCode(u.getCode());
                res.setFloor(u.getFloor());
                res.setPosition(u.getPosition());
            });
        }

        // Loại kho
        res.setUnitTypeId(contract.getUnitTypeId());
        if (unitTypeRepository != null) {
            unitTypeRepository.findById(contract.getUnitTypeId()).ifPresent(ut -> {
                res.setUnitTypeName(ut.getName());
                res.setUnitDimensions(String.format("%.1fm x %.1fm x %.1fm",
                        ut.getWidthM() != null ? ut.getWidthM().doubleValue() : 0.0,
                        ut.getLengthM() != null ? ut.getLengthM().doubleValue() : 0.0,
                        ut.getHeightM() != null ? ut.getHeightM().doubleValue() : 0.0));
            });
        }

        // Thời hạn & tài chính
        res.setStartDate(contract.getStartDate());
        res.setEndDateExclusive(contract.getEndDateExclusive());
        res.setRentalMonths(contract.getRentalMonths());
        res.setMonthlyPrice(contract.getMonthlyPrice());
        res.setDepositAmount(contract.getDepositAmount());
        res.setDepositBalance(contract.getDepositBalance());
        res.setStatus(contract.getStatus().name());
        res.setAccessPinLength(PolicyNumbers.snapshotInt(contract.getPolicySnapshot(), "accessPinLength", 6));

        LocalDate now = LocalDate.now();

        // Tính ngày còn lại & cảnh báo sắp hết hạn
        if (contract.getEndDateExclusive() != null) {
            long remaining = ChronoUnit.DAYS.between(now, contract.getEndDateExclusive());
            res.setDaysRemaining(Math.max(0, remaining));

            if (contract.getStatus() == ContractStatus.ACTIVE) {
                res.setNearExpiration(remaining <= 7 && remaining >= 0);
            } else {
                res.setNearExpiration(false);
            }
        }

        // Kiểm tra nghiệm thu trả kho
        if (contract.getStatus() == ContractStatus.PENDING_RETURN && returnRequestRepository != null) {
            returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contract.getId()).ifPresent(req -> {
                if (req.getInspectedAt() != null) {
                    res.setInspectionDone(true);
                }
            });
        }

        // Xử lý mã Access Code và Quá hạn theo BR-OVD-01..03 & BR-RET-09
        if (contract.getStatus() == ContractStatus.OVERDUE) {
            long overdueDays = 0;
            if (contract.getEndDateExclusive() != null && now.isAfter(contract.getEndDateExclusive())) {
                overdueDays = ChronoUnit.DAYS.between(contract.getEndDateExclusive(), now);
            }
            res.setOverdueDays(Math.max(1, overdueDays));

            // BR-OVD-01: Trong 3 ngày ân hạn đầu tiên, mã PIN vẫn mở được kho bình thường, chưa tính phí phạt
            if (overdueDays <= 3) {
                res.setAccessCode(contract.getAccessCode());
                res.setAccessCodeLocked(false);
                res.setOverdueFeeAccrued(0);
                res.setTotalOutstandingDebt(0);
            } else {
                long fee = contract.getOverdueFeeAccrued();
                res.setOverdueFeeAccrued(fee);
                res.setTotalOutstandingDebt(fee);

                // BR-OVD-02, BR-OVD-03 & BR-OVD-05:
                // D+4..D+6: Phí phạt phát sinh nhưng mã mở cửa VẪN BÌNH THƯỜNG để khách vào dọn đồ trả kho.
                // D+7: Khóa an ninh nếu còn nợ phí phạt (fee > 0). Nếu đã tất toán (fee == 0), mở lại mã PIN để dọn kho.
                if (overdueDays < 7) {
                    res.setAccessCode(contract.getAccessCode());
                    res.setAccessCodeLocked(false);
                } else {
                    if (fee > 0) {
                        res.setAccessCode(null);
                        res.setAccessCodeLocked(true);
                    } else {
                        res.setAccessCode(contract.getAccessCode());
                        res.setAccessCodeLocked(false);
                    }
                }
            }
        } else if (contract.getStatus() == ContractStatus.ACTIVE || contract.getStatus() == ContractStatus.PENDING_RETURN) {
            if (res.isInspectionDone()) {
                res.setAccessCode(null);
                res.setAccessCodeLocked(true);
            } else {
                res.setAccessCode(contract.getAccessCode());
                res.setAccessCodeLocked(false);
            }
            res.setOverdueDays(0);
            res.setOverdueFeeAccrued(0);
            res.setTotalOutstandingDebt(0);
        } else {
            // PENDING_CHECK_IN, CLOSED, TERMINATED
            res.setAccessCode(null);
            res.setAccessCodeLocked(contract.getStatus() != ContractStatus.PENDING_CHECK_IN);
            res.setOverdueDays(0);
            res.setOverdueFeeAccrued(0);
            res.setTotalOutstandingDebt(0);
        }

        // Khởi tạo mặc định
        res.setHasPendingRenewal(false);

        // Kiểm tra đơn gia hạn đang chờ
        if (paymentTransactionRepository != null && (contract.getStatus() == ContractStatus.ACTIVE || contract.getStatus() == ContractStatus.OVERDUE)) {
            paymentTransactionRepository.findTopByContractIdAndTransactionTypeOrderByCreatedAtDesc(contract.getId(), "CONTRACT_RENEWAL")
                    .ifPresent(txn -> {
                        if ("PENDING".equals(txn.getStatus())) {
                            Instant expiresAt = txn.getCreatedAt().plus(activeHoldHours(), ChronoUnit.HOURS);
                            if (Instant.now().isBefore(expiresAt)) {
                                res.setHasPendingRenewal(true);
                                res.setPendingRenewalOrderCode(txn.getOrderCode());
                                res.setPendingRenewalMonths(txn.getRenewalMonths());
                                res.setPendingRenewalAmount(txn.getAmount());
                                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX")
                                        .withZone(ZoneId.systemDefault());
                                res.setPendingRenewalExpiresAt(formatter.format(expiresAt));
                            }
                        }
                    });
        }
    }

    @Transactional
    @Override
    public void changeContractPin(Long contractId, ChangePinRequest request, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        // BR-ACC-03: Kiểm tra chính chủ hoặc quyền quản trị
        if (!currentUser.getId().equals(contract.getCustomerId()) && currentUser.getRole() != UserRole.SYSTEM_ADMINISTRATOR) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        // BR-ACC-02: Kiểm tra trạng thái hợp đồng (Chỉ ACTIVE hoặc OVERDUE mới được đổi PIN)
        if (contract.getStatus() != ContractStatus.ACTIVE && contract.getStatus() != ContractStatus.OVERDUE) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION, "Chỉ có thể đổi mã PIN khi hợp đồng đang kích hoạt hoặc trong hạn cho phép");
        }

        int pinLength = PolicyNumbers.snapshotInt(contract.getPolicySnapshot(), "accessPinLength", 6);
        String newPin = request.getNewPin() == null ? "" : request.getNewPin().trim();
        if (!newPin.matches("\\d{" + pinLength + "}")) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED,
                    "Mã PIN phải gồm đúng " + pinLength + " chữ số theo hợp đồng");
        }
        contract.setAccessCode(newPin);
        rentalContractRepository.save(contract);

        // Ghi nhật ký thao tác
        AccessLog log = new AccessLog(
                contractId,
                contract.getStorageUnitId(),
                "PIN_CODE",
                currentUser.getFullName() != null ? currentUser.getFullName() : "Chủ hợp đồng",
                "SUCCESS",
                "Đổi mã PIN khóa điện tử thành công"
        );
        accessLogRepository.save(log);
    }

    @Override
    public List<AccessLogResponse> getContractAccessLogs(Long contractId, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        RentalContract contract = rentalContractRepository.findById(contractId)
                .orElseThrow(() -> new CustomException(ErrorCode.CONTRACT_NOT_FOUND));

        if (!currentUser.getId().equals(contract.getCustomerId()) && currentUser.getRole() != UserRole.SYSTEM_ADMINISTRATOR) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        StorageUnit unit = contract.getStorageUnitId() != null
                ? storageUnitRepository.findById(contract.getStorageUnitId()).orElse(null)
                : null;
        String unitCode = unit != null ? unit.getCode() : "U-" + contractId;

        return accessLogRepository.findByContractIdOrderByAccessedAtDesc(contractId)
                .stream()
                .map(l -> new AccessLogResponse(
                        l.getId(),
                        l.getContractId(),
                        unitCode,
                        l.getAccessedAt(),
                        l.getMethod(),
                        l.getAccessorName(),
                        l.getStatus(),
                        l.getDeviceInfo()
                ))
                .collect(Collectors.toList());
    }
}


