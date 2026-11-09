package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.contract.repository.ReturnRequestRepository;
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
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class StaffDailyTaskServiceImpl implements StaffDailyTaskService {

    public static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final SupportRequestRepository supportRequestRepository;
    private final StaffDailyAssignmentRepository staffDailyAssignmentRepository;
    private final RentalContractRepository rentalContractRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final UserFacilityAssignmentRepository userFacilityAssignmentRepository;
    private final PolicyVersionRepository policyVersionRepository;

    @Autowired(required = false)
    private ReturnRequestRepository returnRequestRepository;

    public StaffDailyTaskServiceImpl(
            SupportRequestRepository supportRequestRepository,
            StaffDailyAssignmentRepository staffDailyAssignmentRepository,
            RentalContractRepository rentalContractRepository,
            StorageUnitRepository storageUnitRepository,
            FacilityRepository facilityRepository,
            UserRepository userRepository,
            UserFacilityAssignmentRepository userFacilityAssignmentRepository,
            PolicyVersionRepository policyVersionRepository
    ) {
        this.supportRequestRepository = supportRequestRepository;
        this.staffDailyAssignmentRepository = staffDailyAssignmentRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
        this.userFacilityAssignmentRepository = userFacilityAssignmentRepository;
        this.policyVersionRepository = policyVersionRepository;
    }

    @Override
    public StaffDailyTasksResponse getDailyTasks(Long staffId, LocalDate date, Boolean pendingOnly, UserPrincipal currentUser) {
        LocalDate today = LocalDate.now(VN_ZONE);
        LocalDate targetDate = (date != null) ? date : today;
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
        List<DailyCheckInTaskDto> checkInTasks = loadCheckInTasks(staffId, targetDate, onlyPending);

        // 5. Nhóm 2: Lịch hẹn trả kho & kiểm tra (Return / Inspection - FS-06, FS-04)
        List<DailyReturnTaskDto> returnTasks = loadReturnTasks(staffId, targetDate, onlyPending);

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

    private int resolveCheckinGraceDays(RentalContract c) {
        if (policyVersionRepository != null) {
            Optional<PolicyVersion> active = policyVersionRepository
                    .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now());
            if (active.isPresent() && active.get().getCheckinGraceDays() != null) {
                return active.get().getCheckinGraceDays();
            }
        }
        return com.swp391.selfstorage.policy.service.PolicyNumbers.snapshotInt(
                c != null ? c.getPolicySnapshot() : null, "checkinGraceDays", 10);
    }

    private List<DailyCheckInTaskDto> loadCheckInTasks(Long staffId, LocalDate date, boolean onlyPending) {
        List<DailyCheckInTaskDto> result = new ArrayList<>();
        Set<Long> processedContractIds = new HashSet<>();
        LocalDate today = LocalDate.now(VN_ZONE);
        boolean isToday = date.isEqual(today);

        // Actionable Inbox (Ponytail):
        // Nếu là hôm nay: lấy các việc được tạo hôm nay hoặc tạo trong quá khứ nhưng chưa thực hiện, cùng các việc trong cửa sổ ân hạn 10 ngày
        // Nếu là ngày khác: lọc chính xác theo ngày đó
        List<StaffDailyAssignment> assignments = new ArrayList<>();
        if (isToday) {
            List<StaffDailyAssignment> windowList = staffDailyAssignmentRepository.findByStaffIdAndWorkDateBetween(
                    staffId, today.minusDays(10), today);
            if (windowList != null) {
                assignments.addAll(windowList);
            }
            List<StaffDailyAssignment> allForStaff = staffDailyAssignmentRepository.findByStaffId(staffId);
            if (allForStaff != null) {
                assignments.addAll(allForStaff);
            }
        } else {
            List<StaffDailyAssignment> dateList = staffDailyAssignmentRepository.findByStaffIdAndWorkDate(staffId, date);
            if (dateList != null) {
                assignments.addAll(dateList);
            }
        }

        for (StaffDailyAssignment a : assignments) {
            if (a.getTaskType() == AssignmentTaskType.HANDOVER && a.getReferenceId() != null) {
                rentalContractRepository.findById(a.getReferenceId()).ifPresent(c -> {
                    LocalDate workDate = a.getWorkDate() != null ? a.getWorkDate() : c.getStartDate();
                    LocalDate createdDate = c.getCreatedAt() != null
                            ? c.getCreatedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                            : null;

                    DailyCheckInTaskDto dto = toCheckInDto(c);
                    boolean isTodayTask;
                    boolean isLatePending = false;

                    if (!dto.isCompleted() && c.getStatus() == ContractStatus.PENDING_CHECK_IN) {
                        isTodayTask = (workDate != null && workDate.isEqual(date))
                                || (createdDate != null && createdDate.isEqual(date))
                                || (isToday && createdDate != null && !createdDate.isAfter(date));
                        isLatePending = isToday
                                && workDate != null
                                && workDate.isBefore(date)
                                && isWithinGracePeriod(c, date);
                    } else {
                        LocalDate checkinDate = c.getCheckinDate();
                        isTodayTask = (checkinDate != null && checkinDate.isEqual(date))
                                || (workDate != null && workDate.isEqual(date) && (checkinDate == null || checkinDate.isEqual(date)));
                    }

                    if ((isTodayTask || isLatePending) && processedContractIds.add(c.getId())) {
                        if (isLatePending) {
                            dto.setLate(true);
                            long diff = java.time.temporal.ChronoUnit.DAYS.between(workDate, date);
                            dto.setDaysLate((int) diff);
                        }
                        if (!onlyPending || !dto.isCompleted()) {
                            result.add(dto);
                        }
                    }
                });
            }
        }

        return result;
    }

    private boolean isWithinGracePeriod(RentalContract c, LocalDate date) {
        if (c == null || c.getStartDate() == null) return false;
        int graceDays = resolveCheckinGraceDays(c);
        LocalDate graceDeadline = c.getStartDate().plusDays(Math.max(0, graceDays));
        return !date.isAfter(graceDeadline);
    }

    private List<DailyReturnTaskDto> loadReturnTasks(Long staffId, LocalDate date, boolean onlyPending) {
        List<DailyReturnTaskDto> result = new ArrayList<>();
        Set<Long> processedContractIds = new HashSet<>();
        LocalDate today = LocalDate.now(VN_ZONE);
        boolean isToday = date.isEqual(today);

        List<StaffDailyAssignment> assignments = new ArrayList<>();
        if (isToday) {
            List<StaffDailyAssignment> windowList = staffDailyAssignmentRepository.findByStaffIdAndWorkDateBetween(
                    staffId, today.minusDays(30), today);
            if (windowList != null) {
                assignments.addAll(windowList);
            }
            List<StaffDailyAssignment> allForStaff = staffDailyAssignmentRepository.findByStaffId(staffId);
            if (allForStaff != null) {
                assignments.addAll(allForStaff);
            }
        } else {
            List<StaffDailyAssignment> dateList = staffDailyAssignmentRepository.findByStaffIdAndWorkDate(staffId, date);
            if (dateList != null) {
                assignments.addAll(dateList);
            }
        }

        for (StaffDailyAssignment a : assignments) {
            if (a.getReferenceId() == null) continue;
            boolean isReturnType = a.getTaskType() == AssignmentTaskType.RETURN
                    || a.getTaskType() == AssignmentTaskType.INSPECTION;
            boolean isHandoverFallback = a.getTaskType() == AssignmentTaskType.HANDOVER;
            if (!isReturnType && !isHandoverFallback) continue;

            rentalContractRepository.findById(a.getReferenceId()).ifPresent(c -> {
                if (isHandoverFallback && c.getStatus() != ContractStatus.PENDING_RETURN) {
                    return;
                }
                var reqOpt = returnRequestRepository != null
                        ? returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(c.getId())
                        : Optional.<com.swp391.selfstorage.contract.entity.ReturnRequest>empty();
                if (isHandoverFallback && reqOpt.isPresent()
                        && reqOpt.get().getInspectedBy() != null
                        && !reqOpt.get().getInspectedBy().equals(staffId)) {
                    return;
                }

                LocalDate workDate = a.getWorkDate() != null ? a.getWorkDate() : c.getEndDateExclusive();
                LocalDate returnCreatedDate = reqOpt.isPresent() && reqOpt.get().getRequestedAt() != null
                        ? reqOpt.get().getRequestedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                        : c.getReturnDate();

                DailyReturnTaskDto dto = toReturnDto(c);
                boolean isTodayTask;
                boolean isLatePending = false;

                if (!dto.isCompleted()) {
                    isTodayTask = (workDate != null && workDate.isEqual(date))
                            || (returnCreatedDate != null && returnCreatedDate.isEqual(date))
                            || (isToday && returnCreatedDate != null && !returnCreatedDate.isAfter(date));
                    isLatePending = isToday
                            && workDate != null
                            && workDate.isBefore(date)
                            && (c.getStatus() == ContractStatus.PENDING_RETURN || c.getStatus() == ContractStatus.OVERDUE);
                } else {
                    LocalDate inspectedDate = reqOpt.isPresent() && reqOpt.get().getInspectedAt() != null
                            ? reqOpt.get().getInspectedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                            : null;
                    isTodayTask = (inspectedDate != null && inspectedDate.isEqual(date))
                            || (workDate != null && workDate.isEqual(date) && inspectedDate == null);
                }

                if ((isTodayTask || isLatePending) && processedContractIds.add(c.getId())) {
                    if (isLatePending && workDate != null) {
                        dto.setLate(true);
                        long diff = java.time.temporal.ChronoUnit.DAYS.between(workDate, date);
                        dto.setDaysLate((int) diff);
                    }
                    if (!onlyPending || !dto.isCompleted()) {
                        result.add(dto);
                    }
                }
            });
        }

        if (returnRequestRepository != null) {
            List<com.swp391.selfstorage.contract.entity.ReturnRequest> assignedReturns =
                    returnRequestRepository.findByInspectedBy(staffId);
            if (assignedReturns != null) {
                for (var req : assignedReturns) {
                    if (req.getContractId() == null || processedContractIds.contains(req.getContractId())) {
                        continue;
                    }
                    rentalContractRepository.findById(req.getContractId()).ifPresent(c -> {
                        if (c.getStatus() == ContractStatus.TERMINATED && c.getCheckinDate() == null) {
                            return;
                        }
                        LocalDate returnCreatedDate = req.getRequestedAt() != null
                                ? req.getRequestedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                                : req.getRequestedReturnDate();
                        LocalDate inspectedDate = req.getInspectedAt() != null
                                ? req.getInspectedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                                : null;
                        DailyReturnTaskDto dto = toReturnDto(c);
                        boolean include;
                        if (!dto.isCompleted()) {
                            include = returnCreatedDate == null
                                    || returnCreatedDate.isEqual(date)
                                    || (isToday && !returnCreatedDate.isAfter(date));
                        } else {
                            include = (inspectedDate != null && inspectedDate.isEqual(date))
                                    || (inspectedDate == null && returnCreatedDate != null && returnCreatedDate.isEqual(date));
                        }
                        if (include && processedContractIds.add(c.getId())) {
                            if (!onlyPending || !dto.isCompleted()) {
                                result.add(dto);
                            }
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
        LocalDate today = LocalDate.now(VN_ZONE);
        boolean isToday = date.isEqual(today);

        // Sự cố được phân công trực tiếp cho staff
        List<SupportRequest> assignedRequests = supportRequestRepository.findAllByAssignedStaffId(staffId);
        for (SupportRequest sr : assignedRequests) {
            DailySupportTaskDto dto = toSupportDto(sr);
            boolean include = true;
            if (sr.getCreatedAt() != null) {
                LocalDate createdDate = sr.getCreatedAt().atZoneSameInstant(VN_ZONE).toLocalDate();
                LocalDate resolvedDate = sr.getResolvedAt() != null
                        ? sr.getResolvedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                        : null;
                if (!dto.isCompleted()) {
                    include = createdDate.isEqual(date) || (isToday && !createdDate.isAfter(date));
                } else {
                    include = createdDate.isEqual(date) || (resolvedDate != null && resolvedDate.isEqual(date));
                }
            }
            if (include && processedRequestIds.add(sr.getId())) {
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

        DailyCheckInTaskDto dto = DailyCheckInTaskDto.builder()
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
                .checkinGraceDays(resolveCheckinGraceDays(c))
                .build();
        dto.setScheduledStartTime(c.getScheduledStartTime());
        dto.setScheduledEndTime(c.getScheduledEndTime());
        return dto;
    }

    private DailyReturnTaskDto toReturnDto(RentalContract c) {
        boolean isInspected = false;
        if (returnRequestRepository != null) {
            var reqOpt = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(c.getId());
            if (reqOpt.isPresent() && reqOpt.get().getInspectedAt() != null) {
                isInspected = true;
            }
        }
        boolean completed = c.getStatus() == ContractStatus.RETURNED
                || c.getStatus() == ContractStatus.CLOSED
                || isInspected;
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
        boolean completed = sr.getStatus() == SupportStatus.RESOLVED
                || sr.getStatus() == SupportStatus.CLOSED
                || sr.getStatus() == SupportStatus.AUTO_CLOSED;

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
        if (facilityId != null) {
            facilityName = facilityRepository.findById(facilityId)
                    .map(Facility::getName)
                    .orElse(null);
        }
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
                .createdAt(sr.getCreatedAt())
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
