package com.swp391.selfstorage.reservation.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.service.ContractService;
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
import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import com.swp391.selfstorage.reservation.repository.ReservationRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.entity.UnitType;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.unit.repository.UnitTypeRepository;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

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
@Slf4j
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
    private final ContractService contractService;

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
            @org.springframework.beans.factory.annotation.Autowired(required = false) SupportRequestRepository supportRequestRepository,
            ContractService contractService
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
        this.contractService = contractService;
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
        for (Reservation reservation : reservationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)) {
            if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
                continue;
            }
            if (rentalContractRepository.findByReservationId(reservation.getId()).isPresent()) {
                continue;
            }
            try {
                contractService.ensureContractForPaidReservation(reservation.getId());
            } catch (RuntimeException ex) {
                log.warn("Chưa tạo lại được hợp đồng cho reservationId={}", reservation.getId(), ex);
            }
        }
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

        // Điền thông tin khách hàng phục vụ xem hợp đồng điện tử:
        // Ưu tiên thông tin người thuê ô kho đã điền ở form Đặt chỗ của chính hợp đồng/đơn này, chỉ fallback sang app_user nếu hợp đồng chưa có
        if (contract.getCustomerId() != null && userRepository != null) {
            userRepository.findById(contract.getCustomerId()).ifPresent(u -> {
                detail.setCustomerName(u.getFullName());
                detail.setCustomerPhone(u.getPhone());
                detail.setCustomerEmail(u.getEmail());
                detail.setCustomerIdentityNumber(u.getIdentityNumber());
            });
        }
        if (contract.getReservationId() != null && reservationRepository != null) {
            reservationRepository.findById(contract.getReservationId()).ifPresent(rsv -> {
                if (rsv.getCustomerName() != null && !rsv.getCustomerName().isBlank()) {
                    detail.setCustomerName(rsv.getCustomerName());
                }
                if (rsv.getCustomerPhone() != null && !rsv.getCustomerPhone().isBlank()) {
                    detail.setCustomerPhone(rsv.getCustomerPhone());
                }
                if (rsv.getCustomerEmail() != null && !rsv.getCustomerEmail().isBlank()) {
                    detail.setCustomerEmail(rsv.getCustomerEmail());
                }
                if (rsv.getCustomerIdentityNumber() != null && !rsv.getCustomerIdentityNumber().isBlank()) {
                    detail.setCustomerIdentityNumber(rsv.getCustomerIdentityNumber());
                }
            });
        }
        if (contract.getCustomerName() != null && !contract.getCustomerName().isBlank()) {
            detail.setCustomerName(contract.getCustomerName());
        }
        if (contract.getCustomerPhone() != null && !contract.getCustomerPhone().isBlank()) {
            detail.setCustomerPhone(contract.getCustomerPhone());
        }
        if (contract.getCustomerEmail() != null && !contract.getCustomerEmail().isBlank()) {
            detail.setCustomerEmail(contract.getCustomerEmail());
        }
        if (contract.getCustomerIdentityNumber() != null && !contract.getCustomerIdentityNumber().isBlank()) {
            detail.setCustomerIdentityNumber(contract.getCustomerIdentityNumber());
        }

        // Điền thông tin bàn giao thực tế (Handover Record)
        if (handoverRecordRepository != null) {
            var acceptedHr = handoverRecordRepository.findTopByContractIdAndRejectedFalseOrderByHandoverAtDesc(contract.getId());
            if (acceptedHr.isPresent()) {
                var hr = acceptedHr.get();
                detail.setHandoverConditionNote(hr.getConditionNote());
                detail.setCustomerConfirmedAt(hr.getCustomerConfirmedAt());
                if (hr.getStaffId() != null && userRepository != null) {
                    userRepository.findById(hr.getStaffId()).ifPresent(staff -> {
                        detail.setHandoverStaffName(staff.getFullName());
                    });
                }
            } else if (contract.getCheckinDate() == null && (contract.getStatus() == ContractStatus.TERMINATED || Boolean.TRUE.equals(detail.getRelocationEligible()))) {
                handoverRecordRepository.findByContractId(contract.getId()).ifPresent(hr -> {
                    detail.setHandoverRejected(hr.isRejected() && contract.getStatus() == ContractStatus.TERMINATED);
                    detail.setRejectionReason(hr.getRejectionReason());
                    String note = hr.getRejectionReason() != null ? hr.getRejectionReason() : "";
                    if (hr.getConditionNote() != null && !hr.getConditionNote().isBlank()) {
                        note = note.isBlank() ? hr.getConditionNote() : (note + " — " + hr.getConditionNote());
                    }
                    if (!note.isBlank()) {
                        detail.setHandoverConditionNote(note);
                    }
                    if (hr.getStaffId() != null && userRepository != null) {
                        userRepository.findById(hr.getStaffId()).ifPresent(staff -> {
                            detail.setHandoverStaffName(staff.getFullName());
                        });
                    }
                });
            }
        }

        // Điền thông tin phụ lục điều chuyển kho do sự cố kỹ thuật (nếu hợp đồng không bị hủy bàn giao trước check-in)
        boolean cancelledBeforeCheckIn = contract.getStatus() == ContractStatus.TERMINATED
                || (contract.getStatus() == ContractStatus.CLOSED && contract.getCheckinDate() == null);
        if (contract.getRelocationSupportRequestId() != null && !cancelledBeforeCheckIn) {
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
                detail.setInstructionNotes("Mã PIN của quý khách hiện đang tạm khóa an ninh (Nguyên tắc No Pay, No PIN) do hợp đồng quá hạn. Vui lòng thanh toán trực tuyến VNPay nợ phí quá hạn để nhận mã PIN tạm trong ngày.");
            } else {
                detail.setInstructionNotes("Quý khách đã thanh toán phí quá hạn và được cấp mã PIN tạm trong ngày. Vui lòng bấm 'Báo trả kho' hoặc hoàn tất dọn đồ trước 23:59.");
            }
        } else if (detail.isAccessCodeLocked()) {
            detail.setInstructionNotes("Mã PIN của quý khách hiện đang tạm khóa an ninh do hợp đồng quá hạn hoặc chưa hoàn tất thủ tục.");
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
            if (contract.getRescheduleCount() < 1) {
                actions.add("RESCHEDULE");
            }
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
        res.setCreatedAt(contract.getCreatedAt());

        if (contract.getCustomerId() != null && userRepository != null) {
            userRepository.findById(contract.getCustomerId()).ifPresent(u -> {
                res.setCustomerName(u.getFullName());
                res.setCustomerPhone(u.getPhone());
                res.setCustomerEmail(u.getEmail());
                res.setCustomerIdentityNumber(u.getIdentityNumber());
            });
        }

        if (contract.getReservationId() != null && reservationRepository != null) {
            reservationRepository.findById(contract.getReservationId())
                    .ifPresent(r -> {
                        res.setReservationCode(r.getCode());
                        if (r.getCustomerName() != null && !r.getCustomerName().isBlank()) {
                            res.setCustomerName(r.getCustomerName());
                        }
                        if (r.getCustomerPhone() != null && !r.getCustomerPhone().isBlank()) {
                            res.setCustomerPhone(r.getCustomerPhone());
                        }
                        if (r.getCustomerEmail() != null && !r.getCustomerEmail().isBlank()) {
                            res.setCustomerEmail(r.getCustomerEmail());
                        }
                        if (r.getCustomerIdentityNumber() != null && !r.getCustomerIdentityNumber().isBlank()) {
                            res.setCustomerIdentityNumber(r.getCustomerIdentityNumber());
                        }
                    });
        }

        if (contract.getCustomerName() != null && !contract.getCustomerName().isBlank()) {
            res.setCustomerName(contract.getCustomerName());
        }
        if (contract.getCustomerPhone() != null && !contract.getCustomerPhone().isBlank()) {
            res.setCustomerPhone(contract.getCustomerPhone());
        }
        if (contract.getCustomerEmail() != null && !contract.getCustomerEmail().isBlank()) {
            res.setCustomerEmail(contract.getCustomerEmail());
        }
        if (contract.getCustomerIdentityNumber() != null && !contract.getCustomerIdentityNumber().isBlank()) {
            res.setCustomerIdentityNumber(contract.getCustomerIdentityNumber());
        }

        // Cơ sở
        res.setFacilityId(contract.getFacilityId());
        if (contract.getFacilityId() != null && facilityRepository != null) {
            facilityRepository.findById(contract.getFacilityId()).ifPresent(f -> {
                res.setFacilityName(f.getName());
                res.setFacilityAddress(f.getAddress());
                res.setFacilityPhone(f.getPhone());
            });
        }

        // Kiểm tra xem hợp đồng có đang chờ Quản lý cơ sở đổi ô kho (do sự cố bàn giao) không
        boolean isRelocating = false;
        if (contract.getStatus() == ContractStatus.PENDING_CHECK_IN || contract.getStatus() == ContractStatus.ACTIVE) {
            if (supportRequestRepository != null) {
                isRelocating = supportRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contract.getId())
                        .map(t -> Boolean.TRUE.equals(t.getRelocationRequired())
                                && t.getStatus() != SupportStatus.RESOLVED
                                && t.getStatus() != SupportStatus.CLOSED
                                && t.getStatus() != SupportStatus.AUTO_CLOSED)
                        .orElse(false);
            }
            if (!isRelocating && contract.getStorageUnitId() != null && storageUnitRepository != null) {
                isRelocating = storageUnitRepository.findById(contract.getStorageUnitId())
                        .map(su -> su.getStatus() == StorageUnitStatus.MAINTENANCE)
                        .orElse(false);
            }
        }
        res.setRelocationEligible(isRelocating);
        final boolean effectivelyRelocating = isRelocating;

        // Ô kho
        res.setStorageUnitId(contract.getStorageUnitId());
        if (contract.getStorageUnitId() != null && storageUnitRepository != null) {
            storageUnitRepository.findById(contract.getStorageUnitId()).ifPresent(u -> {
                if (effectivelyRelocating && contract.getStatus() == ContractStatus.PENDING_CHECK_IN) {
                    res.setStorageUnitCode(null);
                } else {
                    res.setStorageUnitCode(u.getCode());
                }
                res.setFloor(u.getFloor());
                res.setPosition(u.getPosition());
            });
        }

        // Loại kho
        res.setUnitTypeId(contract.getUnitTypeId());
        if (contract.getUnitTypeId() != null && unitTypeRepository != null) {
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
        res.setTotalRentalFee(contract.getTotalRentalFee());
        res.setDepositAmount(contract.getDepositAmount());
        res.setDepositBalance(contract.getDepositBalance());
        res.setTotalContractAmount(contract.getTotalRentalFee() + contract.getDepositAmount());
        res.setStatus(contract.getStatus().name());
        res.setRescheduleCount(contract.getRescheduleCount());
        res.setRescheduledAt(contract.getRescheduledAt());
        res.setAccessPinLength(PolicyNumbers.snapshotInt(contract.getPolicySnapshot(), "accessPinLength", 6));

        // Kiểm tra thông tin từ chối nhận kho (Handover Record)
        if (handoverRecordRepository != null && (contract.getStatus() == ContractStatus.TERMINATED || effectivelyRelocating)) {
            handoverRecordRepository.findByContractId(contract.getId())
                    .ifPresent(hr -> {
                        res.setHandoverRejected(hr.isRejected() && contract.getStatus() == ContractStatus.TERMINATED);
                        if (hr.isRejected()) {
                            res.setRejectionReason(hr.getRejectionReason());
                        }
                    });
        }

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

        // Xử lý mã Access Code và Quá hạn theo BR-OVD-01..08 & BR-RET-09 (Nguyên tắc No Pay, No PIN)
        if (contract.getStatus() == ContractStatus.OVERDUE) {
            long overdueDays = 0;
            if (contract.getEndDateExclusive() != null && now.isAfter(contract.getEndDateExclusive())) {
                overdueDays = ChronoUnit.DAYS.between(contract.getEndDateExclusive(), now);
            }
            res.setOverdueDays(Math.max(1, overdueDays));

            long fee = contract.getOverdueFeeAccrued();
            res.setOverdueFeeAccrued(fee);
            res.setTotalOutstandingDebt(fee);

            // BR-OVD-01, BR-OVD-05: Khóa PIN ngay từ D+1 nếu còn nợ phí quá hạn (fee > 0).
            // Chỉ khi khách thanh toán qua VNPay thanh toán hết phí quá hạn (fee == 0) mới được cấp PIN tạm trong ngày (BR-OVD-08).
            if (fee > 0 || contract.getAccessCode() == null) {
                res.setAccessCode(null);
                res.setAccessCodeLocked(true);
            } else {
                res.setAccessCode(contract.getAccessCode());
                res.setAccessCodeLocked(false);
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
        res.setHasPendingInitialPayment(false);

        // Kiểm tra hợp đồng PENDING_CHECK_IN có giao dịch thanh toán ban đầu (cọc + tiền thuê) đang chờ không
        if (paymentTransactionRepository != null && contract.getStatus() == ContractStatus.PENDING_CHECK_IN) {
            List<PaymentTransaction> txns = paymentTransactionRepository.findByContractId(contract.getId());
            boolean hasPaidInitial = txns.stream()
                    .anyMatch(t -> "INITIAL_PAYMENT".equalsIgnoreCase(t.getTransactionType()) && "SUCCESS".equalsIgnoreCase(t.getStatus()));
            Optional<PaymentTransaction> pendingInitial = txns.stream()
                    .filter(t -> "INITIAL_PAYMENT".equalsIgnoreCase(t.getTransactionType()) && "PENDING".equalsIgnoreCase(t.getStatus()))
                    .findFirst();

            if (!hasPaidInitial && pendingInitial.isPresent()) {
                PaymentTransaction p = pendingInitial.get();
                res.setHasPendingInitialPayment(true);
                res.setPendingInitialPaymentOrderCode(p.getOrderCode());
                res.setPendingInitialPaymentAmount(p.getAmount());
                res.setPendingInitialPaymentMethod(p.getPaymentMethod());
            }
        }

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

        // SUP-01 (BR-OVD-05 & BR-ACC-02): Chặn đổi PIN khi quyền truy cập đã bị đình chỉ ở mốc D+7 (accessCode == null)
        if (contract.getStatus() == ContractStatus.OVERDUE
                && (contract.getAccessCode() == null || contract.getAccessCode().isBlank())) {
            throw new CustomException(ErrorCode.ACCESS_SUSPENDED_OVERDUE);
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


