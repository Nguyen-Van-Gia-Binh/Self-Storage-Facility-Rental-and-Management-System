package com.swp391.selfstorage.report.service.impl;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractRenewal;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.ContractRenewalRepository;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.report.dto.*;
import com.swp391.selfstorage.report.service.SystemReportService;
import com.swp391.selfstorage.report.util.CsvReportExportUtil;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SystemReportServiceImpl implements SystemReportService {

    private final FacilityRepository facilityRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final RentalContractRepository rentalContractRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserRepository userRepository;
    private final ContractRenewalRepository contractRenewalRepository;

    @Override
    public SystemRevenueReportResponse getSystemRevenueReport(LocalDate from, LocalDate to, Long facilityId) {
        // 1. Validate khoảng ngày (US-BM-04.1 AC-4)
        if (from != null && to != null && from.isAfter(to)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày kết thúc không được nhỏ hơn ngày bắt đầu");
        }

        final LocalDate effectiveFrom = (from != null) ? from : LocalDate.now().withDayOfMonth(1);
        final LocalDate effectiveTo = (to != null) ? to : LocalDate.now();

        // 2. Xác định danh sách cơ sở cần báo cáo
        List<Facility> targetFacilities = resolveTargetFacilities(facilityId);

        long totalRentalRevenue = 0L;
        long totalSurchargeRevenue = 0L;
        long totalOverdueFeeRevenue = 0L;
        long totalRenewalRevenue = 0L;
        long totalDeposit = 0L;
        long totalRefund = 0L;
        long totalForfeitedDeposit = 0L;
        long overallMrr = 0L;
        long overallActiveContracts = 0L;
        long overallDepositLiability = 0L;
        List<FacilityRevenueShareDto> byFacility = new ArrayList<>();
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");

        // Chuẩn bị 12 tháng gần nhất cho biểu đồ xu hướng (BM-04)
        YearMonth endYm = YearMonth.from(effectiveTo);
        YearMonth startYm = endYm.minusMonths(11);
        Map<YearMonth, MonthlyAccumulator> trendMap = new LinkedHashMap<>();
        YearMonth curYm = startYm;
        while (!curYm.isAfter(endYm)) {
            trendMap.put(curYm, new MonthlyAccumulator());
            curYm = curYm.plusMonths(1);
        }

        for (Facility facility : targetFacilities) {
            List<RentalContract> contracts = rentalContractRepository.findByFacilityId(facility.getId());
            if (contracts == null) {
                contracts = Collections.emptyList();
            }
            Map<Long, RentalContract> contractMap = contracts.stream()
                    .collect(Collectors.toMap(RentalContract::getId, c -> c, (c1, c2) -> c1));

            long facRentalRevenue = 0L;
            long facSurchargeRevenue = 0L;
            long facOverdueFeeRevenue = 0L;
            long facRenewalRevenue = 0L;
            long facDeposit = 0L;
            long facRefund = 0L;
            long facForfeitedDeposit = 0L;
            long facPendingRefundLiability = 0L;

            for (RentalContract contract : contractMap.values()) {
                boolean isContractHoldingDeposit = contract.getStatus() == ContractStatus.PENDING_CHECK_IN
                        || contract.getStatus() == ContractStatus.ACTIVE
                        || contract.getStatus() == ContractStatus.OVERDUE
                        || contract.getStatus() == ContractStatus.PENDING_RETURN;
                // Gộp thanh toán theo contract_id và reservation_id (INITIAL_PAYMENT thường chỉ có reservationId)
                List<PaymentTransaction> payments = new ArrayList<>();
                Set<Long> seenPaymentIds = new HashSet<>();
                List<PaymentTransaction> byContract = paymentTransactionRepository.findByContractId(contract.getId());
                if (byContract != null) {
                    for (PaymentTransaction p : byContract) {
                        if (p.getId() != null) {
                            if (seenPaymentIds.add(p.getId())) {
                                payments.add(p);
                            }
                        } else {
                            payments.add(p);
                        }
                    }
                }
                if (contract.getReservationId() != null) {
                    List<PaymentTransaction> byReservation =
                            paymentTransactionRepository.findByReservationId(contract.getReservationId());
                    if (byReservation != null) {
                        for (PaymentTransaction p : byReservation) {
                            if (p.getId() != null) {
                                if (seenPaymentIds.add(p.getId())) {
                                    payments.add(p);
                                }
                            } else {
                                payments.add(p);
                            }
                        }
                    }
                }
                if (payments.isEmpty()) {
                    continue;
                }
                long contractDepositIn = 0L;
                long contractRentRefund = 0L;
                long contractDepositRefund = 0L;
                YearMonth contractRefundMonth = null;
                for (PaymentTransaction payment : payments) {
                    if (payment.getAmount() == null) {
                        continue;
                    }
                    LocalDate payDate = moneyDate(payment, zone);
                    String type = payment.getTransactionType() == null ? "" : payment.getTransactionType();
                    long amount = payment.getAmount();
                    boolean isSuccess = "SUCCESS".equalsIgnoreCase(payment.getStatus());
                    boolean refund = countsAsRefund(payment);
                    long[] refundParts = refund ? splitRefund(payment, contract) : new long[] {0L, 0L};

                    if (!isContractHoldingDeposit
                            && amount > 0
                            && refund
                            && "PENDING_REFUND".equalsIgnoreCase(payment.getStatus())) {
                        facPendingRefundLiability += refundParts[1];
                    }
                    if (payDate == null) {
                        continue;
                    }
                    YearMonth payYm = YearMonth.from(payDate);
                    MonthlyAccumulator monthAcc = trendMap.get(payYm);
                    if (monthAcc != null && isSuccess && !refund) {
                        if ("CONTRACT_RENEWAL".equalsIgnoreCase(type) || "RENEWAL_PAYMENT".equalsIgnoreCase(type)) {
                            monthAcc.renewal += amount;
                        } else if ("EXTRA_FEE_PAYMENT".equalsIgnoreCase(type) || "SETTLEMENT".equalsIgnoreCase(type)) {
                            monthAcc.surcharge += amount;
                        } else if ("OVERDUE_PENALTY".equalsIgnoreCase(type)) {
                            monthAcc.overdueFee += amount;
                        } else if ("INITIAL_PAYMENT".equalsIgnoreCase(type)) {
                            long[] parts = splitInitial(amount, contract);
                            monthAcc.rental += parts[0];
                            if (parts[2] > 0) {
                                monthAcc.surcharge += parts[2];
                            }
                        } else {
                            monthAcc.rental += amount;
                        }
                    }

                    if (payDate.isBefore(effectiveFrom) || payDate.isAfter(effectiveTo)) {
                        continue;
                    }
                    if (refund) {
                        facRefund += amount;
                        contractRentRefund += refundParts[0];
                        contractDepositRefund += refundParts[1];
                        contractRefundMonth = payYm;
                        if (monthAcc != null) {
                            monthAcc.rental -= refundParts[0];
                        }
                        continue;
                    }
                    if (!isSuccess) {
                        continue;
                    }
                    if ("CONTRACT_RENEWAL".equalsIgnoreCase(type) || "RENEWAL_PAYMENT".equalsIgnoreCase(type)) {
                        facRenewalRevenue += amount;
                    } else if ("EXTRA_FEE_PAYMENT".equalsIgnoreCase(type) || "SETTLEMENT".equalsIgnoreCase(type)) {
                        facSurchargeRevenue += amount;
                    } else if ("OVERDUE_PENALTY".equalsIgnoreCase(type)) {
                        facOverdueFeeRevenue += amount;
                    } else if ("INITIAL_PAYMENT".equalsIgnoreCase(type)) {
                        long[] parts = splitInitial(amount, contract);
                        facRentalRevenue += parts[0];
                        facDeposit += parts[1];
                        contractDepositIn += parts[1];
                        if (parts[2] > 0) {
                            facSurchargeRevenue += parts[2];
                        }
                    } else {
                        facRentalRevenue += amount;
                    }
                }
                facRentalRevenue -= contractRentRefund;
                if (!isContractHoldingDeposit) {
                    long forfeited = Math.max(0L, contractDepositIn - contractDepositRefund);
                    facRentalRevenue += forfeited;
                    facForfeitedDeposit += forfeited;
                    if (contractRefundMonth != null) {
                        MonthlyAccumulator refundMonth = trendMap.get(contractRefundMonth);
                        if (refundMonth != null) {
                            refundMonth.rental += forfeited;
                        }
                    }
                }
            }

            long facTotalRevenue = facRentalRevenue + facRenewalRevenue + facSurchargeRevenue + facOverdueFeeRevenue;

            // Tính Net MRR (sau chiết khấu) & Deposit Liability (Khoản nợ phải trả)
            long facMrr = 0L;
            long facActiveContracts = 0L;
            long facDepositLiability = facPendingRefundLiability;

            for (RentalContract c : contractMap.values()) {
                long netMonthlyPrice = currentMonthlyPrice(c);
                if (c.getStatus() == ContractStatus.ACTIVE) {
                    facActiveContracts++;
                    facMrr += netMonthlyPrice;
                }
                if (wasActivated(c)) {
                    YearMonth cStart = (c.getStartDate() != null) ? YearMonth.from(c.getStartDate()) : startYm;
                    YearMonth cEnd = endYm;
                    if (c.getEndDateExclusive() != null) {
                        cEnd = YearMonth.from(c.getEndDateExclusive().minusDays(1));
                    }
                    for (Map.Entry<YearMonth, MonthlyAccumulator> entry : trendMap.entrySet()) {
                        YearMonth ym = entry.getKey();
                        if (!ym.isBefore(cStart) && !ym.isAfter(cEnd)) {
                            entry.getValue().mrr += netMonthlyPrice;
                        }
                    }
                }
                if (c.getStatus() == ContractStatus.PENDING_CHECK_IN
                        || c.getStatus() == ContractStatus.ACTIVE
                        || c.getStatus() == ContractStatus.OVERDUE
                        || c.getStatus() == ContractStatus.PENDING_RETURN) {
                    if (c.getDepositBalance() > 0) {
                        facDepositLiability += c.getDepositBalance();
                    }
                }
            }

            overallMrr += facMrr;
            overallActiveContracts += facActiveContracts;
            overallDepositLiability += facDepositLiability;

            byFacility.add(FacilityRevenueShareDto.builder()
                    .facilityId(facility.getId())
                    .facilityName(facility.getName())
                    .revenue(facTotalRevenue)
                    .totalRevenue(facTotalRevenue)
                    .rentalRevenue(facRentalRevenue)
                    .surchargeRevenue(facSurchargeRevenue)
                    .overdueFeeRevenue(facOverdueFeeRevenue)
                    .renewalRevenue(facRenewalRevenue)
                    .depositBalance(facDeposit)
                    .refundAmount(facRefund)
                    .forfeitedDeposit(facForfeitedDeposit)
                    .mrr(facMrr)
                    .activeContractCount(facActiveContracts)
                    .depositLiability(facDepositLiability)
                    .build());

            totalRentalRevenue += facRentalRevenue;
            totalSurchargeRevenue += facSurchargeRevenue;
            totalOverdueFeeRevenue += facOverdueFeeRevenue;
            totalRenewalRevenue += facRenewalRevenue;
            totalDeposit += facDeposit;
            totalRefund += facRefund;
            totalForfeitedDeposit += facForfeitedDeposit;
        }

        long totalRevenue = totalRentalRevenue + totalRenewalRevenue + totalSurchargeRevenue + totalOverdueFeeRevenue;

        List<MonthlyRevenueTrendDto> monthlyTrends = new ArrayList<>();
        for (Map.Entry<YearMonth, MonthlyAccumulator> entry : trendMap.entrySet()) {
            YearMonth ym = entry.getKey();
            MonthlyAccumulator acc = entry.getValue();
            String monthStr = ym.toString();
            String monthLabel = String.format("T%02d/%s", ym.getMonthValue(), String.valueOf(ym.getYear()).substring(2));
            monthlyTrends.add(MonthlyRevenueTrendDto.builder()
                    .month(monthStr)
                    .monthLabel(monthLabel)
                    .rentalRevenue(acc.rental)
                    .surchargeRevenue(acc.surcharge)
                    .overdueFeeRevenue(acc.overdueFee)
                    .renewalRevenue(acc.renewal)
                    .cashFlow(acc.getCashFlow())
                    .mrr(acc.mrr)
                    .build());
        }

        return SystemRevenueReportResponse.builder()
                .from(effectiveFrom.toString())
                .to(effectiveTo.toString())
                .totalRevenue(totalRevenue)
                .rentalRevenue(totalRentalRevenue)
                .surchargeRevenue(totalSurchargeRevenue)
                .overdueFeeRevenue(totalOverdueFeeRevenue)
                .renewalRevenue(totalRenewalRevenue)
                .depositBalance(totalDeposit)
                .totalRefundAmount(totalRefund)
                .forfeitedDeposit(totalForfeitedDeposit)
                .mrr(overallMrr)
                .activeContractCount(overallActiveContracts)
                .totalDepositLiability(overallDepositLiability)
                .monthlyTrends(monthlyTrends)
                .byFacility(byFacility)
                .build();
    }

    @Override
    public SystemOccupancyReportResponse getSystemOccupancyReport(Long facilityId) {
        List<Facility> targetFacilities = resolveTargetFacilities(facilityId);

        long overallTotalUnits = 0L;
        long overallOccupiedUnits = 0L;
        long overallAvailableUnits = 0L;
        long overallExploitableUnits = 0L;
        List<FacilityOccupancyDetailDto> facilityDetails = new ArrayList<>();

        for (Facility facility : targetFacilities) {
            List<StorageUnit> units = storageUnitRepository.findByFacilityId(facility.getId());
            if (units == null) {
                units = Collections.emptyList();
            }

            long totalUnits = units.size();
            long availableUnits = units.stream().filter(u -> u.getStatus() == StorageUnitStatus.AVAILABLE).count();
            long reservedUnits = units.stream().filter(u -> u.getStatus() == StorageUnitStatus.RESERVED).count();
            long occupiedUnits = units.stream().filter(u -> u.getStatus() == StorageUnitStatus.OCCUPIED).count();
            long cleaningUnits = units.stream().filter(u -> u.getStatus() == StorageUnitStatus.CLEANING).count();
            long maintenanceUnits = units.stream().filter(u -> u.getStatus() == StorageUnitStatus.MAINTENANCE).count();
            long outOfServiceUnits = units.stream().filter(u -> u.getStatus() == StorageUnitStatus.OUT_OF_SERVICE)
                    .count();

            List<RentalContract> contracts = rentalContractRepository.findByFacilityId(facility.getId());
            long overdueContractsCount = (contracts != null)
                    ? contracts.stream().filter(c -> c.getStatus() == ContractStatus.OVERDUE).count()
                    : 0L;

            // Usage Rate = Occupied / (Total - OutOfService - Maintenance) (REP-03, BR-AVL-01)
            long exploitableUnits = totalUnits - outOfServiceUnits - maintenanceUnits;
            Double occupancyRate = null;
            if (exploitableUnits > 0) {
                BigDecimal rate = BigDecimal.valueOf((double) occupiedUnits / exploitableUnits)
                        .setScale(3, RoundingMode.HALF_UP);
                occupancyRate = rate.doubleValue();
            }

            facilityDetails.add(FacilityOccupancyDetailDto.builder()
                    .facilityId(facility.getId())
                    .facilityName(facility.getName())
                    .totalUnits(totalUnits)
                    .availableUnits(availableUnits)
                    .reservedUnits(reservedUnits)
                    .occupiedUnits(occupiedUnits)
                    .cleaningUnits(cleaningUnits)
                    .maintenanceUnits(maintenanceUnits)
                    .outOfServiceUnits(outOfServiceUnits)
                    .overdueContractsCount(overdueContractsCount)
                    .occupancyRate(occupancyRate)
                    .build());

            overallTotalUnits += totalUnits;
            overallOccupiedUnits += occupiedUnits;
            overallAvailableUnits += availableUnits;
            overallExploitableUnits += exploitableUnits;
        }

        // Sắp xếp các cơ sở theo tỷ lệ lấp đầy giảm dần (US-BM-04.2 AC-3)
        facilityDetails.sort(Comparator.comparing(
                FacilityOccupancyDetailDto::getOccupancyRate,
                Comparator.nullsLast(Comparator.reverseOrder())));

        Double overallOccupancyRate = null;
        if (overallExploitableUnits > 0) {
            BigDecimal rate = BigDecimal.valueOf((double) overallOccupiedUnits / overallExploitableUnits)
                    .setScale(3, RoundingMode.HALF_UP);
            overallOccupancyRate = rate.doubleValue();
        }

        return SystemOccupancyReportResponse.builder()
                .overallOccupancyRate(overallOccupancyRate)
                .totalUnits(overallTotalUnits)
                .totalOccupiedUnits(overallOccupiedUnits)
                .totalAvailableUnits(overallAvailableUnits)
                .facilities(facilityDetails)
                .build();
    }

        @Override
    public PageResponse<OverdueContractDetailDto> getSystemOverdueContracts(Long facilityId, Integer minOverdueDays, Pageable pageable) {
        LocalDate today = LocalDate.now();

        // 1. Lấy danh sách hợp đồng theo phạm vi cơ sở
        List<RentalContract> allContracts;
        if (facilityId != null) {
            facilityRepository.findById(facilityId)
                    .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND, "Không tìm thấy cơ sở: " + facilityId));
            allContracts = rentalContractRepository.findByFacilityId(facilityId);
        } else {
            allContracts = rentalContractRepository.findAll();
        }

        if (allContracts == null) {
            allContracts = Collections.emptyList();
        }

        // 2. Lọc hợp đồng quá hạn (Trạng thái OVERDUE hoặc ACTIVE nhưng đã qua endDateExclusive)
        List<RentalContract> overdueContracts = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.OVERDUE
                        || (c.getStatus() == ContractStatus.ACTIVE && c.getEndDateExclusive() != null && c.getEndDateExclusive().isBefore(today)))
                .toList();

        if (overdueContracts.isEmpty()) {
            return PageResponse.from(new PageImpl<>(Collections.emptyList(), pageable, 0));
        }

        // 3. Batch Fetch chống N+1 Query
        Set<Long> customerIds = overdueContracts.stream().map(RentalContract::getCustomerId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, AppUser> userMap = customerIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(customerIds).stream().collect(Collectors.toMap(AppUser::getId, u -> u, (u1, u2) -> u1));

        Set<Long> unitIds = overdueContracts.stream().map(RentalContract::getStorageUnitId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, StorageUnit> unitMap = unitIds.isEmpty() ? Collections.emptyMap() :
                storageUnitRepository.findAllById(unitIds).stream().collect(Collectors.toMap(StorageUnit::getId, u -> u, (u1, u2) -> u1));

        Set<Long> facIds = overdueContracts.stream().map(RentalContract::getFacilityId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Long, Facility> facMap = facIds.isEmpty() ? Collections.emptyMap() :
                facilityRepository.findAllById(facIds).stream().collect(Collectors.toMap(Facility::getId, f -> f, (f1, f2) -> f1));

        // 4. Chuyển đổi sang DTO và tính toán số ngày trễ
        List<OverdueContractDetailDto> dtoList = new ArrayList<>();
        for (RentalContract c : overdueContracts) {
            long overdueDays = 0;
            if (c.getEndDateExclusive() != null && c.getEndDateExclusive().isBefore(today)) {
                overdueDays = ChronoUnit.DAYS.between(c.getEndDateExclusive(), today);
            }

            // Lọc theo minOverdueDays nếu có
            if (minOverdueDays != null && overdueDays < minOverdueDays) {
                continue;
            }

            long totalDebt = c.getOverdueFeeAccrued();

            AppUser customer = userMap.get(c.getCustomerId());
            StorageUnit unit = unitMap.get(c.getStorageUnitId());
            Facility fac = facMap.get(c.getFacilityId());

            dtoList.add(OverdueContractDetailDto.builder()
                    .contractId(c.getId())
                    .contractCode(c.getCode())
                    .customerId(c.getCustomerId())
                    .customerName(customer != null ? customer.getFullName() : "N/A")
                    .customerPhone(customer != null ? customer.getPhone() : "N/A")
                    .customerEmail(customer != null ? customer.getEmail() : "N/A")
                    .facilityId(c.getFacilityId())
                    .facilityName(fac != null ? fac.getName() : "N/A")
                    .storageUnitId(c.getStorageUnitId())
                    .unitCode(unit != null ? unit.getCode() : "N/A")
                    .startDate(c.getStartDate())
                    .endDateExclusive(c.getEndDateExclusive())
                    .overdueDays(overdueDays)
                    .monthlyPrice(c.getMonthlyPrice())
                    .accruedOverdueFee(c.getOverdueFeeAccrued())
                    .totalOutstandingDebt(totalDebt)
                    .status(c.getStatus())
                    .build());
        }

        // Sắp xếp theo số ngày quá hạn giảm dần
        dtoList.sort(Comparator.comparingLong(OverdueContractDetailDto::getOverdueDays).reversed());

        // Phân trang trên bộ nhớ
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), dtoList.size());
        List<OverdueContractDetailDto> pageContent = (start <= end && start < dtoList.size())
                ? dtoList.subList(start, end)
                : Collections.emptyList();

        Page<OverdueContractDetailDto> pageResult = new PageImpl<>(pageContent, pageable, dtoList.size());
        return PageResponse.from(pageResult);
    }

    @Override
    public byte[] exportSystemReport(ReportExportType type, LocalDate from, LocalDate to, Long facilityId, UserPrincipal currentUser) {
        if (type == null) {
            type = ReportExportType.REVENUE;
        }

        return switch (type) {
            case REVENUE -> {
                SystemRevenueReportResponse report = getSystemRevenueReport(from, to, facilityId);
                yield CsvReportExportUtil.exportRevenueReport(report, currentUser);
            }
            case OCCUPANCY -> {
                SystemOccupancyReportResponse report = getSystemOccupancyReport(facilityId);
                yield CsvReportExportUtil.exportOccupancyReport(report, currentUser);
            }
            case OVERDUE -> {
                // Xuất toàn bộ danh sách hợp đồng quá hạn không phân trang (kích thước lớn)
                PageResponse<OverdueContractDetailDto> paged = getSystemOverdueContracts(facilityId, null, PageRequest.of(0, 10000));
                yield CsvReportExportUtil.exportOverdueReport(paged.getContent(), currentUser);
            }
        };
    }

    private List<Facility> resolveTargetFacilities(Long facilityId) {
        if (facilityId != null) {
            Facility facility = facilityRepository.findById(facilityId)
                    .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND,
                            "Không tìm thấy cơ sở lưu trữ: " + facilityId));
            return List.of(facility);
        }
        return facilityRepository.findAll();
    }

    private long currentMonthlyPrice(RentalContract c) {
        if (contractRenewalRepository != null && c.getId() != null) {
            Optional<ContractRenewal> latest = contractRenewalRepository
                    .findTopByContractIdOrderByCreatedAtDesc(c.getId());
            if (latest != null && latest.isPresent()
                    && latest.get().getMonthlyPriceSnapshot() != null
                    && latest.get().getMonthlyPriceSnapshot() > 0) {
                return latest.get().getMonthlyPriceSnapshot();
            }
        }
        int months = Math.max(1, c.getRentalMonths());
        return c.getTotalRentalFee() / months;
    }

    private static boolean wasActivated(RentalContract c) {
        ContractStatus status = c.getStatus();
        if (status == ContractStatus.ACTIVE
                || status == ContractStatus.OVERDUE
                || status == ContractStatus.PENDING_RETURN
                || status == ContractStatus.RETURNED
                || status == ContractStatus.CLOSED) {
            return true;
        }
        return status == ContractStatus.TERMINATED && c.getCheckinDate() != null;
    }

    /** shortcut: giao dịch SUCCESS cũ chưa có paid_at dùng createdAt, bỏ khi đã backfill. */
    private static LocalDate moneyDate(PaymentTransaction payment, ZoneId zone) {
        Instant instant = payment.getPaidAt() != null ? payment.getPaidAt() : payment.getCreatedAt();
        if (instant == null) {
            return null;
        }
        return instant.atZone(zone).toLocalDate();
    }

    private static boolean countsAsRefund(PaymentTransaction payment) {
        String type = payment.getTransactionType() == null ? "" : payment.getTransactionType();
        if (!"REFUND".equalsIgnoreCase(type)
                && !"RENT_REFUND".equalsIgnoreCase(type)
                && !"DEPOSIT_REFUND".equalsIgnoreCase(type)) {
            return false;
        }
        String status = payment.getStatus() == null ? "" : payment.getStatus();
        return "PENDING_REFUND".equalsIgnoreCase(status) || "SUCCESS".equalsIgnoreCase(status);
    }

    /** [rent, deposit]. REFUND gộp cũ: trừ tiền thuê trước, phần còn lại là cọc. */
    private static long[] splitRefund(PaymentTransaction payment, RentalContract contract) {
        long amount = Math.max(0L, payment.getAmount());
        String type = payment.getTransactionType() == null ? "" : payment.getTransactionType();
        if ("RENT_REFUND".equalsIgnoreCase(type)) {
            return new long[] {amount, 0L};
        }
        if ("DEPOSIT_REFUND".equalsIgnoreCase(type)) {
            return new long[] {0L, amount};
        }
        long rentCap = Math.max(0L, contract.getTotalRentalFee());
        long rentPart = Math.min(amount, rentCap);
        return new long[] {rentPart, amount - rentPart};
    }

    /** [rent, deposit, extra]. */
    private static long[] splitInitial(long amount, RentalContract contract) {
        long rentCap = Math.max(0L, contract.getTotalRentalFee());
        long depositCap = Math.max(0L, contract.getDepositAmount());
        long rentPart = Math.min(amount, rentCap);
        long depositPart = Math.min(Math.max(0L, amount - rentPart), depositCap);
        long extra = amount - rentPart - depositPart;
        return new long[] {rentPart, depositPart, extra};
    }

    private static class MonthlyAccumulator {
        long rental = 0L;
        long surcharge = 0L;
        long overdueFee = 0L;
        long renewal = 0L;
        long mrr = 0L;

        long getCashFlow() {
            return rental + surcharge + overdueFee + renewal;
        }
    }

}
