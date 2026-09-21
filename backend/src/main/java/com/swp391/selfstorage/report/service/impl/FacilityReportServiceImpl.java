package com.swp391.selfstorage.report.service.impl;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.report.dto.DebtAgeBracket;
import com.swp391.selfstorage.report.dto.FacilityOverviewReportResponse;
import com.swp391.selfstorage.report.dto.OverdueContractDebtDto;
import com.swp391.selfstorage.report.dto.OverdueDebtReportResponse;
import com.swp391.selfstorage.report.service.FacilityReportService;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FacilityReportServiceImpl implements FacilityReportService {

    private final FacilityRepository facilityRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final RentalContractRepository rentalContractRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;

    @Override
    public FacilityOverviewReportResponse getFacilityOverview(Long facilityId, String month, UserPrincipal currentUser) {
        Facility facility = validateFacilityAccess(facilityId, currentUser);

        final YearMonth targetMonth = parseYearMonth(month);

        // 1. Thống kê ô kho (AC-1, AC-2)
        Page<StorageUnit> unitsPage = storageUnitRepository.findByFacilityIdAndFilters(facilityId, null, null, Pageable.unpaged());
        List<StorageUnit> allUnits = unitsPage != null ? unitsPage.getContent() : Collections.emptyList();

        long totalUnits = allUnits.size();
        long availableUnits = allUnits.stream().filter(u -> u.getStatus() == StorageUnitStatus.AVAILABLE).count();
        long occupiedUnits = allUnits.stream().filter(u -> u.getStatus() == StorageUnitStatus.OCCUPIED).count();
        long maintenanceUnits = allUnits.stream().filter(u -> u.getStatus() == StorageUnitStatus.MAINTENANCE).count();
        long outOfServiceUnits = allUnits.stream().filter(u -> u.getStatus() == StorageUnitStatus.OUT_OF_SERVICE).count();

        long exploitableUnits = totalUnits - outOfServiceUnits;
        double occupancyRate = 0.0;
        if (exploitableUnits > 0) {
            BigDecimal rate = BigDecimal.valueOf((double) occupiedUnits / exploitableUnits)
                    .setScale(3, RoundingMode.HALF_UP);
            occupancyRate = rate.doubleValue();
        }

        // 2. Thống kê hợp đồng thuê tại cơ sở
        List<RentalContract> contracts = rentalContractRepository.findByFacilityId(facilityId);
        if (contracts == null) {
            contracts = Collections.emptyList();
        }

        long activeContracts = contracts.stream().filter(c -> c.getStatus() == ContractStatus.ACTIVE).count();
        long overdueContracts = contracts.stream().filter(c -> c.getStatus() == ContractStatus.OVERDUE).count();

        long newContracts = contracts.stream().filter(c -> {
            if (c.getStartDate() != null && YearMonth.from(c.getStartDate()).equals(targetMonth)) {
                return true;
            }
            if (c.getCreatedAt() != null && YearMonth.from(c.getCreatedAt()).equals(targetMonth)) {
                return true;
            }
            return false;
        }).count();

        long returnedContracts = contracts.stream().filter(c -> {
            if (c.getStatus() == ContractStatus.RETURNED || c.getStatus() == ContractStatus.CLOSED) {
                if (c.getReturnDate() != null && YearMonth.from(c.getReturnDate()).equals(targetMonth)) {
                    return true;
                }
                if (c.getClosedAt() != null && YearMonth.from(c.getClosedAt()).equals(targetMonth)) {
                    return true;
                }
            }
            return false;
        }).count();

        long depositBalance = contracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE
                        || c.getStatus() == ContractStatus.OVERDUE
                        || c.getStatus() == ContractStatus.PENDING_RETURN
                        || c.getStatus() == ContractStatus.PENDING_CHECK_IN)
                .mapToLong(RentalContract::getDepositBalance)
                .sum();

        // 3. Tính doanh thu tài chính theo tháng (AC-3)
        List<Long> contractIds = contracts.stream().map(RentalContract::getId).toList();
        long rentalRevenue = 0;
        long surchargeRevenue = 0;

        if (!contractIds.isEmpty()) {
            List<PaymentTransaction> monthlyPayments = new ArrayList<>();
            for (Long cId : contractIds) {
                List<PaymentTransaction> pList = paymentTransactionRepository.findByContractId(cId);
                if (pList != null) {
                    for (PaymentTransaction p : pList) {
                        if ("SUCCESS".equalsIgnoreCase(p.getStatus()) && p.getCreatedAt() != null) {
                            if (YearMonth.from(p.getCreatedAt()).equals(targetMonth)) {
                                monthlyPayments.add(p);
                            }
                        }
                    }
                }
            }

            if (!monthlyPayments.isEmpty()) {
                Map<Long, RentalContract> contractMap = contracts.stream()
                        .collect(Collectors.toMap(RentalContract::getId, c -> c, (c1, c2) -> c1));

                for (PaymentTransaction p : monthlyPayments) {
                    RentalContract c = contractMap.get(p.getContractId());
                    if ("RENEWAL_PAYMENT".equalsIgnoreCase(p.getTransactionType())) {
                        rentalRevenue += p.getAmount() != null ? p.getAmount() : 0L;
                    } else if ("EXTRA_FEE_PAYMENT".equalsIgnoreCase(p.getTransactionType())) {
                        surchargeRevenue += p.getAmount() != null ? p.getAmount() : 0L;
                    } else if ("INITIAL_PAYMENT".equalsIgnoreCase(p.getTransactionType())) {
                        long amount = p.getAmount() != null ? p.getAmount() : 0L;
                        long rent = c != null ? c.getTotalRentalFee() : amount;
                        long rentPart = Math.min(amount, rent);
                        rentalRevenue += rentPart;
                        long extra = amount - rentPart - (c != null ? c.getDepositAmount() : 0L);
                        if (extra > 0) surchargeRevenue += extra;
                    } else {
                        rentalRevenue += p.getAmount() != null ? p.getAmount() : 0L;
                    }
                }
            } else {
                // Fallback nếu hợp đồng được tạo mà chưa có bản ghi PaymentTransaction
                rentalRevenue = contracts.stream()
                        .filter(c -> (c.getStartDate() != null && YearMonth.from(c.getStartDate()).equals(targetMonth))
                                || (c.getCreatedAt() != null && YearMonth.from(c.getCreatedAt()).equals(targetMonth)))
                        .mapToLong(RentalContract::getTotalRentalFee)
                        .sum();

                surchargeRevenue = contracts.stream()
                        .filter(c -> (c.getStartDate() != null && YearMonth.from(c.getStartDate()).equals(targetMonth))
                                || (c.getCreatedAt() != null && YearMonth.from(c.getCreatedAt()).equals(targetMonth)))
                        .mapToLong(RentalContract::getOverdueFeeAccrued)
                        .sum();
            }
        }

        long totalRevenue = rentalRevenue + surchargeRevenue;

        return FacilityOverviewReportResponse.builder()
                .facilityId(facility.getId())
                .facilityName(facility.getName())
                .month(targetMonth.toString())
                .totalUnits(totalUnits)
                .availableUnits(availableUnits)
                .occupiedUnits(occupiedUnits)
                .maintenanceUnits(maintenanceUnits)
                .occupancyRate(occupancyRate)
                .activeContracts(activeContracts)
                .overdueContracts(overdueContracts)
                .newContracts(newContracts)
                .returnedContracts(returnedContracts)
                .totalRevenue(totalRevenue)
                .rentalRevenue(rentalRevenue)
                .surchargeRevenue(surchargeRevenue)
                .depositBalance(depositBalance)
                .build();
    }

    @Override
    public PageResponse<ContractSummaryResponse> getFacilityContracts(
            Long facilityId,
            ContractStatus status,
            Integer expiringSoonDays,
            Pageable pageable,
            UserPrincipal currentUser) {

        validateFacilityAccess(facilityId, currentUser);

        Specification<RentalContract> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("facilityId"), facilityId));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (expiringSoonDays != null && expiringSoonDays > 0) {
                LocalDate today = LocalDate.now();
                LocalDate threshold = today.plusDays(expiringSoonDays);
                predicates.add(cb.equal(root.get("status"), ContractStatus.ACTIVE));
                predicates.add(cb.greaterThanOrEqualTo(root.get("endDateExclusive"), today));
                predicates.add(cb.lessThanOrEqualTo(root.get("endDateExclusive"), threshold));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<RentalContract> contractPage = rentalContractRepository.findAll(spec, pageable);
        LocalDate today = LocalDate.now();

        List<ContractSummaryResponse> content = contractPage.getContent().stream().map(c -> {
            boolean nearExpiration = c.getEndDateExclusive() != null
                    && !c.getEndDateExclusive().isAfter(today.plusDays(7))
                    && c.getStatus() == ContractStatus.ACTIVE;

            return ContractSummaryResponse.builder()
                    .id(c.getId())
                    .code(c.getCode())
                    .customerId(c.getCustomerId())
                    .facilityId(c.getFacilityId())
                    .storageUnitId(c.getStorageUnitId())
                    .unitTypeId(c.getUnitTypeId())
                    .startDate(c.getStartDate())
                    .endDateExclusive(c.getEndDateExclusive())
                    .rentalMonths(c.getRentalMonths())
                    .monthlyPrice(c.getMonthlyPrice())
                    .depositAmount(c.getDepositAmount())
                    .depositBalance(c.getDepositBalance())
                    .status(c.getStatus())
                    .nearExpiration(nearExpiration)
                    .build();
        }).toList();

        return new PageResponse<>(
                content,
                contractPage.getNumber(),
                contractPage.getSize(),
                contractPage.getTotalElements(),
                contractPage.getTotalPages()
        );
    }

    @Override
    public OverdueDebtReportResponse getFacilityOverdueDebt(Long facilityId, UserPrincipal currentUser) {
        Facility facility = validateFacilityAccess(facilityId, currentUser);

        List<RentalContract> contracts = rentalContractRepository.findByFacilityId(facilityId);
        if (contracts == null) {
            contracts = Collections.emptyList();
        }

        LocalDate today = LocalDate.now();
        List<RentalContract> overdueContracts = contracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.OVERDUE
                        || (c.getStatus() == ContractStatus.ACTIVE && c.getEndDateExclusive() != null && c.getEndDateExclusive().isBefore(today)))
                .toList();

        Set<Long> customerIds = overdueContracts.stream().map(RentalContract::getCustomerId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, AppUser> userMap = customerIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(customerIds).stream().collect(Collectors.toMap(AppUser::getId, u -> u, (u1, u2) -> u1));

        Set<Long> unitIds = overdueContracts.stream().map(RentalContract::getStorageUnitId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, StorageUnit> unitMap = unitIds.isEmpty() ? Collections.emptyMap() :
                storageUnitRepository.findAllById(unitIds).stream().collect(Collectors.toMap(StorageUnit::getId, u -> u, (u1, u2) -> u1));

        List<OverdueContractDebtDto> dtoList = new ArrayList<>();
        for (RentalContract c : overdueContracts) {
            long overdueDays = 0;
            if (c.getEndDateExclusive() != null && c.getEndDateExclusive().isBefore(today)) {
                overdueDays = ChronoUnit.DAYS.between(c.getEndDateExclusive(), today);
            }

            long totalDebt = c.getOverdueFeeAccrued();
            if (totalDebt == 0 && c.getMonthlyPrice() > 0) {
                totalDebt = c.getMonthlyPrice();
            }

            AppUser customer = userMap.get(c.getCustomerId());
            StorageUnit unit = unitMap.get(c.getStorageUnitId());

            OverdueContractDebtDto dto = OverdueContractDebtDto.builder()
                    .contractId(c.getId())
                    .contractCode(c.getCode())
                    .customerId(c.getCustomerId())
                    .customerName(customer != null ? customer.getFullName() : "N/A")
                    .customerPhone(customer != null ? customer.getPhone() : "N/A")
                    .storageUnitId(c.getStorageUnitId())
                    .unitCode(unit != null ? unit.getCode() : "N/A")
                    .endDateExclusive(c.getEndDateExclusive())
                    .overdueDays(overdueDays)
                    .monthlyRentalPrice(c.getMonthlyPrice())
                    .accruedOverdueFee(c.getOverdueFeeAccrued())
                    .totalDebt(totalDebt)
                    .status(c.getStatus())
                    .build();

            dtoList.add(dto);
        }

        // Sắp xếp theo số ngày quá hạn giảm dần
        dtoList.sort(Comparator.comparingLong(OverdueContractDebtDto::getOverdueDays).reversed());

        // Phân bổ 3 bracket (AC-4)
        List<OverdueContractDebtDto> listD1ToD10 = new ArrayList<>();
        List<OverdueContractDebtDto> listD11ToD30 = new ArrayList<>();
        List<OverdueContractDebtDto> listOverD30 = new ArrayList<>();

        for (OverdueContractDebtDto dto : dtoList) {
            if (dto.getOverdueDays() >= 1 && dto.getOverdueDays() <= 10) {
                listD1ToD10.add(dto);
            } else if (dto.getOverdueDays() >= 11 && dto.getOverdueDays() <= 30) {
                listD11ToD30.add(dto);
            } else {
                listOverD30.add(dto);
            }
        }

        DebtAgeBracket bracketD1ToD10 = DebtAgeBracket.builder()
                .bracketCode("D1_TO_D10")
                .bracketName("Quá hạn 1 - 10 ngày (Grace & Overlock)")
                .contractCount(listD1ToD10.size())
                .totalDebt(listD1ToD10.stream().mapToLong(OverdueContractDebtDto::getTotalDebt).sum())
                .contracts(listD1ToD10)
                .build();

        DebtAgeBracket bracketD11ToD30 = DebtAgeBracket.builder()
                .bracketCode("D11_TO_D30")
                .bracketName("Quá hạn 11 - 30 ngày (Chuẩn bị thanh lý)")
                .contractCount(listD11ToD30.size())
                .totalDebt(listD11ToD30.stream().mapToLong(OverdueContractDebtDto::getTotalDebt).sum())
                .contracts(listD11ToD30)
                .build();

        DebtAgeBracket bracketOverD30 = DebtAgeBracket.builder()
                .bracketCode("OVER_D30")
                .bracketName("Quá hạn trên 30 ngày (Thanh lý tài sản)")
                .contractCount(listOverD30.size())
                .totalDebt(listOverD30.stream().mapToLong(OverdueContractDebtDto::getTotalDebt).sum())
                .contracts(listOverD30)
                .build();

        long totalOverdueDebt = dtoList.stream().mapToLong(OverdueContractDebtDto::getTotalDebt).sum();

        return OverdueDebtReportResponse.builder()
                .facilityId(facility.getId())
                .facilityName(facility.getName())
                .totalOverdueContracts(dtoList.size())
                .totalOverdueDebt(totalOverdueDebt)
                .bracketD1ToD10(bracketD1ToD10)
                .bracketD11ToD30(bracketD11ToD30)
                .bracketOverD30(bracketOverD30)
                .contracts(dtoList)
                .build();
    }

    private Facility validateFacilityAccess(Long facilityId, UserPrincipal currentUser) {
        if (facilityId == null) {
            throw new CustomException(ErrorCode.FACILITY_NOT_FOUND, "Mã cơ sở không được để trống");
        }

        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND, "Không tìm thấy cơ sở lưu trữ: " + facilityId));

        if (currentUser != null && currentUser.getRole() == UserRole.FACILITY_MANAGER) {
            if (currentUser.getFacilityIds() == null || !currentUser.getFacilityIds().contains(facilityId)) {
                log.warn("FacilityManager user={} denied access to facility={}", currentUser.getId(), facilityId);
                throw new CustomException(ErrorCode.FACILITY_ACCESS_DENIED, "Quản lý cơ sở không có quyền truy cập cơ sở này");
            }
        }

        return facility;
    }

    private YearMonth parseYearMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(month.trim());
        } catch (Exception e) {
            return YearMonth.now();
        }
    }
}
