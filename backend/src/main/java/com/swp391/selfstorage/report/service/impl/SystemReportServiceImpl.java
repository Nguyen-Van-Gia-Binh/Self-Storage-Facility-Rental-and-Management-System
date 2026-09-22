package com.swp391.selfstorage.report.service.impl;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.payment.entity.PaymentTransaction;
import com.swp391.selfstorage.payment.repository.PaymentTransactionRepository;
import com.swp391.selfstorage.report.dto.FacilityOccupancyDetailDto;
import com.swp391.selfstorage.report.dto.FacilityRevenueShareDto;
import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;
import com.swp391.selfstorage.report.service.SystemReportService;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
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
}
