package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.support.dto.*;
import com.swp391.selfstorage.support.entity.AssignmentTaskType;
import com.swp391.selfstorage.support.entity.StaffDailyAssignment;
import com.swp391.selfstorage.support.entity.SupportRequest;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class StaffDailyTaskServiceImpl implements StaffDailyTaskService {

    private final SupportRequestRepository supportRequestRepository;
    private final StaffDailyAssignmentRepository staffDailyAssignmentRepository;
    private final RentalContractRepository rentalContractRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final UserFacilityAssignmentRepository userFacilityAssignmentRepository;

    public StaffDailyTaskServiceImpl(
            SupportRequestRepository supportRequestRepository,
            StaffDailyAssignmentRepository staffDailyAssignmentRepository,
            RentalContractRepository rentalContractRepository,
            StorageUnitRepository storageUnitRepository,
            FacilityRepository facilityRepository,
            UserRepository userRepository,
            UserFacilityAssignmentRepository userFacilityAssignmentRepository
    ) {
        this.supportRequestRepository = supportRequestRepository;
        this.staffDailyAssignmentRepository = staffDailyAssignmentRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
        this.userFacilityAssignmentRepository = userFacilityAssignmentRepository;
    }

    @Override
    public StaffDailyTasksResponse getDailyTasks(Long staffId, LocalDate date, Boolean pendingOnly, UserPrincipal currentUser) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        boolean onlyPending = Boolean.TRUE.equals(pendingOnly);

        // 1. Kiểm tra tồn tại và vai trò của nhân viên
        AppUser staff = userRepository.findById(staffId)
                .orElseThrow(() -> new CustomException(ErrorCode.STAFF_NOT_FOUND));

        if (staff.getRole() != UserRole.FACILITY_STAFF) {
            throw new CustomException(ErrorCode.STAFF_NOT_FOUND, "Người dùng không phải nhân viên cơ sở");
        }
        if (staff.getStatus() != UserStatus.ACTIVE) {
            throw new CustomException(ErrorCode.STAFF_NOT_ACTIVE);
        }

        // 2. Kiểm tra phân quyền truy cập
        validatePermissions(staffId, currentUser);

        // 3. Tra cứu cơ sở làm việc của nhân viên
        List<Long> staffFacilityIds = userFacilityAssignmentRepository.findFacilityIdsByUserId(staffId);
        Long primaryFacilityId = (staffFacilityIds != null && !staffFacilityIds.isEmpty()) ? staffFacilityIds.get(0) : null;
        String primaryFacilityName = (primaryFacilityId != null)
                ? facilityRepository.findById(primaryFacilityId).map(Facility::getName).orElse(null)
                : null;

        // 4. Nhóm 1: Lịch hẹn nhận kho (Check-in / Handover - FS-06, FS-01, FS-02)
        List<DailyCheckInTaskDto> checkInTasks = loadCheckInTasks(staffId, staffFacilityIds, targetDate, onlyPending);

        // 5. Nhóm 2: Lịch hẹn trả kho & kiểm tra (Return / Inspection - FS-06, FS-04)
        List<DailyReturnTaskDto> returnTasks = loadReturnTasks(staffId, staffFacilityIds, targetDate, onlyPending);

        // 6. Nhóm 3: Sự cố & Vận hành (Support / Overlock - FS-06, FS-05)
        List<DailySupportTaskDto> supportTasks = loadSupportTasks(staffId, targetDate, onlyPending);

        // 7. Thống kê tổng hợp ca trực
        DailyTasksSummaryDto summary = calculateSummary(checkInTasks, returnTasks, supportTasks);

        return StaffDailyTasksResponse.builder()
                .date(targetDate)
                .staffId(staff.getId())
                .staffName(staff.getFullName())
                .facilityId(primaryFacilityId)
                .facilityName(primaryFacilityName)
                .summary(summary)
                .checkInTasks(checkInTasks)
                .returnTasks(returnTasks)
                .supportTasks(supportTasks)
                .build();
    }

    private void validatePermissions(Long staffId, UserPrincipal currentUser) {
        if (currentUser.getRole() == UserRole.FACILITY_STAFF) {
            if (!currentUser.getId().equals(staffId)) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Nhân viên chỉ có quyền xem bảng công việc của chính mình");
            }
        } else if (currentUser.getRole() == UserRole.FACILITY_MANAGER) {
            List<Long> staffFacilityIds = userFacilityAssignmentRepository.findFacilityIdsByUserId(staffId);
            List<Long> managerFacilityIds = currentUser.getFacilityIds();
            boolean hasOverlap = managerFacilityIds != null && staffFacilityIds != null
                    && staffFacilityIds.stream().anyMatch(managerFacilityIds::contains);
            if (!hasOverlap) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không quản lý cơ sở của nhân viên này");
            }
        } else if (currentUser.getRole() != UserRole.SYSTEM_ADMINISTRATOR && currentUser.getRole() != UserRole.BUSINESS_OPERATIONS_MANAGER) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    private List<DailyCheckInTaskDto> loadCheckInTasks(Long staffId, List<Long> facilityIds, LocalDate date, boolean onlyPending) {
        List<DailyCheckInTaskDto> result = new ArrayList<>();
        Set<Long> processedContractIds = new HashSet<>();

        // Hợp đồng check-in trong ngày tại các cơ sở của staff
        if (facilityIds != null) {
            for (Long fId : facilityIds) {
                List<RentalContract> contracts = rentalContractRepository.findByFacilityId(fId);
                for (RentalContract c : contracts) {
                    if (c.getStartDate() != null && c.getStartDate().isEqual(date)) {
                        if (processedContractIds.add(c.getId())) {
                            DailyCheckInTaskDto dto = toCheckInDto(c);
                            if (!onlyPending || !dto.isCompleted()) {
                                result.add(dto);
                            }
                        }
                    }
                }
            }
        }

        // Nhiệm vụ phân công cụ thể qua staff_daily_assignment (HANDOVER)
        List<StaffDailyAssignment> assignments = staffDailyAssignmentRepository.findByStaffIdAndWorkDate(staffId, date);
        for (StaffDailyAssignment a : assignments) {
            if (a.getTaskType() == AssignmentTaskType.HANDOVER && a.getReferenceId() != null) {
                if (processedContractIds.add(a.getReferenceId())) {
                    rentalContractRepository.findById(a.getReferenceId()).ifPresent(c -> {
                        DailyCheckInTaskDto dto = toCheckInDto(c);
                        if (!onlyPending || !dto.isCompleted()) {
                            result.add(dto);
                        }
                    });
                }
            }
        }

        return result;
    }

    private List<DailyReturnTaskDto> loadReturnTasks(Long staffId, List<Long> facilityIds, LocalDate date, boolean onlyPending) {
        List<DailyReturnTaskDto> result = new ArrayList<>();
        Set<Long> processedContractIds = new HashSet<>();

        // Hợp đồng hết hạn hoặc đang PENDING_RETURN / OVERDUE tại các cơ sở của staff
        if (facilityIds != null) {
            for (Long fId : facilityIds) {
                List<RentalContract> contracts = rentalContractRepository.findByFacilityId(fId);
                for (RentalContract c : contracts) {
                    boolean isDateMatch = c.getEndDateExclusive() != null && c.getEndDateExclusive().isEqual(date);
                    boolean isPendingReturn = c.getStatus() == ContractStatus.PENDING_RETURN;
                    boolean isOverdue = c.getStatus() == ContractStatus.OVERDUE;

                    if (isDateMatch || isPendingReturn || isOverdue) {
                        if (processedContractIds.add(c.getId())) {
                            DailyReturnTaskDto dto = toReturnDto(c);
                            if (!onlyPending || !dto.isCompleted()) {
                                result.add(dto);
                            }
                        }
                    }
                }
            }
        }

        // Nhiệm vụ phân công cụ thể qua staff_daily_assignment (RETURN / INSPECTION)
        List<StaffDailyAssignment> assignments = staffDailyAssignmentRepository.findByStaffIdAndWorkDate(staffId, date);
        for (StaffDailyAssignment a : assignments) {
            if ((a.getTaskType() == AssignmentTaskType.RETURN || a.getTaskType() == AssignmentTaskType.INSPECTION)
                    && a.getReferenceId() != null) {
                if (processedContractIds.add(a.getReferenceId())) {
                    rentalContractRepository.findById(a.getReferenceId()).ifPresent(c -> {
                        DailyReturnTaskDto dto = toReturnDto(c);
                        if (!onlyPending || !dto.isCompleted()) {
                            result.add(dto);
                        }
                    });
                }
            }
        }

        return result;
    }

    private List<DailySupportTaskDto> loadSupportTasks(Long staffId, LocalDate date, boolean onlyPending) {
        List<DailySupportTaskDto> result = new ArrayList<>();
        Set<Long> processedRequestIds = new HashSet<>();

        // Sự cố được phân công trực tiếp cho staff
        List<SupportRequest> assignedRequests = supportRequestRepository.findAllByAssignedStaffId(staffId);
        for (SupportRequest sr : assignedRequests) {
            if (processedRequestIds.add(sr.getId())) {
                DailySupportTaskDto dto = toSupportDto(sr);
                if (!onlyPending || !dto.isCompleted()) {
                    result.add(dto);
                }
            }
        }

        // Nhiệm vụ phân công cụ thể qua staff_daily_assignment (SUPPORT)
        List<StaffDailyAssignment> assignments = staffDailyAssignmentRepository.findByStaffIdAndWorkDate(staffId, date);
        for (StaffDailyAssignment a : assignments) {
            if (a.getTaskType() == AssignmentTaskType.SUPPORT && a.getReferenceId() != null) {
                if (processedRequestIds.add(a.getReferenceId())) {
                    supportRequestRepository.findById(a.getReferenceId()).ifPresent(sr -> {
                        DailySupportTaskDto dto = toSupportDto(sr);
                        if (!onlyPending || !dto.isCompleted()) {
                            result.add(dto);
                        }
                    });
                }
            }
        }

        return result;
    }

    private DailyCheckInTaskDto toCheckInDto(RentalContract c) {
        boolean completed = c.getStatus() == ContractStatus.ACTIVE || c.getCheckinDate() != null;
        String status;
        if (completed) {
            status = "COMPLETED";
        } else if (c.getStatus() == ContractStatus.TERMINATED) {
            status = "TERMINATED";
            completed = true;
        } else {
            status = "PENDING";
        }

        String customerName = null;
        String customerPhone = null;
        if (c.getCustomerId() != null) {
            Optional<AppUser> userOpt = userRepository.findById(c.getCustomerId());
            if (userOpt.isPresent()) {
                customerName = userOpt.get().getFullName();
                customerPhone = userOpt.get().getPhone();
            }
        }

        String unitCode = null;
        if (c.getStorageUnitId() != null) {
            unitCode = storageUnitRepository.findById(c.getStorageUnitId())
                    .map(StorageUnit::getCode)
                    .orElse(null);
        }

        String facilityName = null;
        if (c.getFacilityId() != null) {
            facilityName = facilityRepository.findById(c.getFacilityId())
                    .map(Facility::getName)
                    .orElse(null);
        }

        return DailyCheckInTaskDto.builder()
                .contractId(c.getId())
                .contractCode(c.getCode())
                .reservationId(c.getReservationId())
                .customerId(c.getCustomerId())
                .customerName(customerName)
                .customerPhone(customerPhone)
                .storageUnitId(c.getStorageUnitId())
                .storageUnitCode(unitCode)
                .facilityId(c.getFacilityId())
                .facilityName(facilityName)
                .scheduledDate(c.getStartDate())
                .status(status)
                .completed(completed)
                .build();
    }

    private DailyReturnTaskDto toReturnDto(RentalContract c) {
        boolean completed = c.getStatus() == ContractStatus.RETURNED || c.getReturnDate() != null;
        String status;
        if (completed) {
            status = "COMPLETED";
        } else if (c.getStatus() == ContractStatus.OVERDUE) {
            status = "OVERDUE";
        } else {
            status = "PENDING";
        }

        String customerName = null;
        String customerPhone = null;
        if (c.getCustomerId() != null) {
            Optional<AppUser> userOpt = userRepository.findById(c.getCustomerId());
            if (userOpt.isPresent()) {
                customerName = userOpt.get().getFullName();
                customerPhone = userOpt.get().getPhone();
            }
        }

        String unitCode = null;
        if (c.getStorageUnitId() != null) {
            unitCode = storageUnitRepository.findById(c.getStorageUnitId())
                    .map(StorageUnit::getCode)
                    .orElse(null);
        }

        String facilityName = null;
        if (c.getFacilityId() != null) {
            facilityName = facilityRepository.findById(c.getFacilityId())
                    .map(Facility::getName)
                    .orElse(null);
        }

        return DailyReturnTaskDto.builder()
                .contractId(c.getId())
                .contractCode(c.getCode())
                .customerId(c.getCustomerId())
                .customerName(customerName)
                .customerPhone(customerPhone)
                .storageUnitId(c.getStorageUnitId())
                .storageUnitCode(unitCode)
                .facilityId(c.getFacilityId())
                .facilityName(facilityName)
                .scheduledDate(c.getEndDateExclusive())
                .status(status)
                .completed(completed)
                .build();
    }

    private DailySupportTaskDto toSupportDto(SupportRequest sr) {
        boolean completed = sr.getStatus() == SupportStatus.RESOLVED || sr.getStatus() == SupportStatus.CLOSED;

        String unitCode = null;
        Long facilityId = null;
        if (sr.getStorageUnitId() != null) {
            Optional<StorageUnit> unitOpt = storageUnitRepository.findById(sr.getStorageUnitId());
            if (unitOpt.isPresent()) {
                unitCode = unitOpt.get().getCode();
                facilityId = unitOpt.get().getFacilityId();
            }
        }

        if (facilityId == null && sr.getContractId() != null) {
            facilityId = rentalContractRepository.findById(sr.getContractId())
                    .map(RentalContract::getFacilityId)
                    .orElse(null);
        }

        String facilityName = null;
        String customerName = null;
        String customerPhone = null;
        if (sr.getCustomerId() != null) {
            Optional<AppUser> userOpt = userRepository.findById(sr.getCustomerId());
            if (userOpt.isPresent()) {
                customerName = userOpt.get().getFullName();
                customerPhone = userOpt.get().getPhone();
            }
        }

        return DailySupportTaskDto.builder()
                .supportRequestId(sr.getId())
                .code(sr.getCode())
                .category(sr.getCategory())
                .categoryDisplayName(sr.getCategory() != null ? sr.getCategory().getDisplayName() : null)
                .description(sr.getDescription())
                .storageUnitId(sr.getStorageUnitId())
                .storageUnitCode(unitCode)
                .facilityId(facilityId)
                .facilityName(facilityName)
                .customerId(sr.getCustomerId())
                .customerName(customerName)
                .customerPhone(customerPhone)
                .isUrgent(sr.getIsUrgent())
                .slaDueAt(sr.getSlaDueAt())
                .status(sr.getStatus())
                .statusDisplayName(sr.getStatus() != null ? sr.getStatus().getDisplayName() : null)
                .completed(completed)
                .build();
    }

    private DailyTasksSummaryDto calculateSummary(
            List<DailyCheckInTaskDto> checkInTasks,
            List<DailyReturnTaskDto> returnTasks,
            List<DailySupportTaskDto> supportTasks
    ) {
        int checkInCount = checkInTasks.size();
        int returnCount = returnTasks.size();
        int supportCount = supportTasks.size();
        int totalTasks = checkInCount + returnCount + supportCount;

        int pendingTasks = 0;
        for (DailyCheckInTaskDto t : checkInTasks) {
            if (!t.isCompleted()) pendingTasks++;
        }
        for (DailyReturnTaskDto t : returnTasks) {
            if (!t.isCompleted()) pendingTasks++;
        }
        for (DailySupportTaskDto t : supportTasks) {
            if (!t.isCompleted()) pendingTasks++;
        }

        int completedTasks = totalTasks - pendingTasks;

        int urgentTasks = 0;
        for (DailySupportTaskDto t : supportTasks) {
            if (Boolean.TRUE.equals(t.getIsUrgent())) {
                urgentTasks++;
            }
        }

        return DailyTasksSummaryDto.builder()
                .totalTasks(totalTasks)
                .pendingTasks(pendingTasks)
                .completedTasks(completedTasks)
                .urgentTasks(urgentTasks)
                .checkInCount(checkInCount)
                .returnCount(returnCount)
                .supportCount(supportCount)
                .build();
    }
}
