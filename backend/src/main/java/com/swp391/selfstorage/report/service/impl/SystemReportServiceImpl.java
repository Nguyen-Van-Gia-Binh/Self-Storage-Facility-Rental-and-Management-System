package com.swp391.selfstorage.report.service.impl;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
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
import java.time.LocalDate;
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

    @Override
    public SystemRevenueReportResponse getSystemRevenueReport(LocalDate from, LocalDate to, Long facilityId) {
        // 1. Validate khoảng ngày (US-BM-04.1 AC-4)
        if (from != null && to != null && from.isAfter(to)) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Ngày kết thúc không được nhỏ hơn ngày bắt đầu");
        }

        final LocalDate effectiveFrom = (from != null) ? from : LocalDate.now().withDayOfMonth(1);
        final LocalDate effectiveTo = (to != null) ? to : LocalDate.now();

        // 2. Xác định danh sách cơ sở cần báo cáo
        List<Facility> targetFacilities;
        if (facilityId != null) {
            Facility facility = facilityRepository.findById(facilityId)
                    .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND,
                            "Không tìm thấy cơ sở lưu trữ: " + facilityId));
            targetFacilities = List.of(facility);
        } else {
            targetFacilities = facilityRepository.findAll();
        }

        long totalRentalRevenue = 0L;
        long totalSurchargeRevenue = 0L;
        long totalOverdueFeeRevenue = 0L;
        List<FacilityRevenueShareDto> byFacility = new ArrayList<>();

        // 3. Tính doanh thu cho từng cơ sở
        for (Facility facility : targetFacilities) {
            List<RentalContract> contracts = rentalContractRepository.findByFacilityId(facility.getId());
            if (contracts == null) {
                contracts = Collections.emptyList();
            }

            long facRentalRevenue = 0L;
            long facSurchargeRevenue = 0L;
            long facOverdueFeeRevenue = 0L;

            List<Long> contractIds = contracts.stream().map(RentalContract::getId).toList();
            List<PaymentTransaction> successfulPayments = new ArrayList<>();

            for (Long cId : contractIds) {
                List<PaymentTransaction> pList = paymentTransactionRepository.findByContractId(cId);
                if (pList != null) {
                    for (PaymentTransaction p : pList) {
                        if ("SUCCESS".equalsIgnoreCase(p.getStatus()) && p.getCreatedAt() != null) {
                            LocalDate payDate = p.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
                            if (!payDate.isBefore(effectiveFrom) && !payDate.isAfter(effectiveTo)) {
                                successfulPayments.add(p);
                            }
                        }
                    }
                }
            }

            if (!successfulPayments.isEmpty()) {
                Map<Long, RentalContract> contractMap = contracts.stream()
                        .collect(Collectors.toMap(RentalContract::getId, c -> c, (c1, c2) -> c1));

                for (PaymentTransaction p : successfulPayments) {
                    RentalContract c = contractMap.get(p.getContractId());
                    long amount = p.getAmount() != null ? p.getAmount() : 0L;

                    if ("RENEWAL_PAYMENT".equalsIgnoreCase(p.getTransactionType())) {
                        facRentalRevenue += amount;
                    } else if ("EXTRA_FEE_PAYMENT".equalsIgnoreCase(p.getTransactionType())) {
                        facSurchargeRevenue += amount;
                    } else if ("INITIAL_PAYMENT".equalsIgnoreCase(p.getTransactionType())) {
                        long rent = (c != null) ? c.getTotalRentalFee() : amount;
                        long rentPart = Math.min(amount, rent);
                        facRentalRevenue += rentPart;
                        long extra = amount - rentPart - ((c != null) ? c.getDepositAmount() : 0L);
                        if (extra > 0) {
                            facSurchargeRevenue += extra;
                        }
                    } else {
                        facRentalRevenue += amount;
                    }
                }

                facOverdueFeeRevenue = contracts.stream()
                        .filter(c -> c.getOverdueFeeAccrued() > 0
                                && c.getEndDateExclusive() != null
                                && !c.getEndDateExclusive().isAfter(effectiveTo))
                        .mapToLong(RentalContract::getOverdueFeeAccrued)
                        .sum();

            } else {
                // Fallback tính theo hợp đồng nếu chưa có giao dịch PaymentTransaction (dữ liệu
                // mock/seed)
                facRentalRevenue = contracts.stream()
                        .filter(c -> (c.getStartDate() != null && !c.getStartDate().isBefore(effectiveFrom)
                                && !c.getStartDate().isAfter(effectiveTo))
                                || (c.getCreatedAt() != null && !c.getCreatedAt().toLocalDate().isBefore(effectiveFrom)
                                        && !c.getCreatedAt().toLocalDate().isAfter(effectiveTo)))
                        .mapToLong(RentalContract::getTotalRentalFee)
                        .sum();

                facOverdueFeeRevenue = contracts.stream()
                        .filter(c -> c.getOverdueFeeAccrued() > 0
                                && c.getEndDateExclusive() != null
                                && !c.getEndDateExclusive().isAfter(effectiveTo))
                        .mapToLong(RentalContract::getOverdueFeeAccrued)
                        .sum();

            }

            long facTotalRevenue = facRentalRevenue + facSurchargeRevenue + facOverdueFeeRevenue;
            byFacility.add(FacilityRevenueShareDto.builder()
                    .facilityId(facility.getId())
                    .facilityName(facility.getName())
                    .revenue(facTotalRevenue)
                    .build());

            totalRentalRevenue += facRentalRevenue;
            totalSurchargeRevenue += facSurchargeRevenue;
            totalOverdueFeeRevenue += facOverdueFeeRevenue;
        }

        long totalRevenue = totalRentalRevenue + totalSurchargeRevenue + totalOverdueFeeRevenue;

        return SystemRevenueReportResponse.builder()
                .from(effectiveFrom.toString())
                .to(effectiveTo.toString())
                .totalRevenue(totalRevenue)
                .rentalRevenue(totalRentalRevenue)
                .surchargeRevenue(totalSurchargeRevenue)
                .overdueFeeRevenue(totalOverdueFeeRevenue)
                .byFacility(byFacility)
                .build();
    }

    @Override
    public SystemOccupancyReportResponse getSystemOccupancyReport(Long facilityId) {
        List<Facility> targetFacilities;
        if (facilityId != null) {
            Facility facility = facilityRepository.findById(facilityId)
                    .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND,
                            "Không tìm thấy cơ sở lưu trữ: " + facilityId));
            targetFacilities = List.of(facility);
        } else {
            targetFacilities = facilityRepository.findAll();
        }

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

            // Usage Rate = Occupied / (Total - OutOfService) (US-BM-04.2 AC-1, AC-4)
            long exploitableUnits = totalUnits - outOfServiceUnits;
            double occupancyRate = 0.0;
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
        facilityDetails.sort(Comparator.comparingDouble(FacilityOccupancyDetailDto::getOccupancyRate).reversed());

        double overallOccupancyRate = 0.0;
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
            if (totalDebt == 0 && c.getMonthlyPrice() > 0) {
                totalDebt = c.getMonthlyPrice();
            }

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

}
