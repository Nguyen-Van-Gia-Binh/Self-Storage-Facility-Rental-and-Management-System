package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.HandoverRecord;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.HandoverRecordRepository;
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

    @Autowired(required = false)
    private HandoverRecordRepository handoverRecordRepository;

    @Autowired(required = false)
    private com.swp391.selfstorage.payment.repository.PaymentTransactionRepository paymentTransactionRepository;

    public void setHandoverRecordRepository(HandoverRecordRepository handoverRecordRepository) {
        this.handoverRecordRepository = handoverRecordRepository;
    }

    public void setPaymentTransactionRepository(
            com.swp391.selfstorage.payment.repository.PaymentTransactionRepository paymentTransactionRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

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

        RequestCache cache = new RequestCache();

        long t0 = System.currentTimeMillis();
        // 4. Nhóm 1: Lịch hẹn nhận kho (Check-in / Handover - FS-06, FS-01, FS-02)
        List<DailyCheckInTaskDto> checkInTasks = loadCheckInTasks(staffId, targetDate, onlyPending, cache);
        long t1 = System.currentTimeMillis();

        // 5. Nhóm 2: Lịch hẹn trả kho & kiểm tra (Return / Inspection - FS-06, FS-04)
        List<DailyReturnTaskDto> returnTasks = loadReturnTasks(staffId, targetDate, onlyPending, cache);
        long t2 = System.currentTimeMillis();

        // 6. Nhóm 3: Sự cố & Vận hành (Support / Overlock - FS-06, FS-05)
        List<DailySupportTaskDto> supportTasks = loadSupportTasks(staffId, targetDate, onlyPending, cache);
        long t3 = System.currentTimeMillis();

        System.out.printf("[PERF] StaffDailyTasks: checkIn=%dms, return=%dms, support=%dms%n", (t1 - t0), (t2 - t1), (t3 - t2));

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

    private static class RequestCache {
        final Map<Long, AppUser> users = new HashMap<>();
        final Map<Long, StorageUnit> units = new HashMap<>();
        final Map<Long, Facility> facilities = new HashMap<>();
        final Map<Long, Optional<RentalContract>> contracts = new HashMap<>();
        final Map<Long, Optional<com.swp391.selfstorage.contract.entity.ReturnRequest>> returnRequests = new HashMap<>();
        final Map<Long, Optional<HandoverRecord>> handoverRecords = new HashMap<>();
        Integer activeGraceDays = null;
    }

    private Optional<RentalContract> getContractCached(Long id, RequestCache cache) {
        if (id == null) return Optional.empty();
        if (cache == null) return rentalContractRepository.findById(id);
        return cache.contracts.computeIfAbsent(id, k -> rentalContractRepository.findById(k));
    }

    private Optional<HandoverRecord> getHandoverRecordCached(Long contractId, RequestCache cache) {
        if (contractId == null || handoverRecordRepository == null) return Optional.empty();
        if (cache == null) return handoverRecordRepository.findByContractId(contractId);
        return cache.handoverRecords.computeIfAbsent(contractId, k -> handoverRecordRepository.findByContractId(k));
    }

    private Optional<com.swp391.selfstorage.contract.entity.ReturnRequest> getReturnRequestCached(Long contractId, RequestCache cache) {
        if (contractId == null || returnRequestRepository == null) return Optional.empty();
        if (cache == null) return returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId);
        return cache.returnRequests.computeIfAbsent(contractId, k -> returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(k));
    }

    private AppUser getUserCached(Long id, RequestCache cache) {
        if (id == null) return null;
        if (cache == null) return userRepository.findById(id).orElse(null);
        return cache.users.computeIfAbsent(id, k -> userRepository.findById(k).orElse(null));
    }

    private StorageUnit getUnitCached(Long id, RequestCache cache) {
        if (id == null) return null;
        if (cache == null) return storageUnitRepository.findById(id).orElse(null);
        return cache.units.computeIfAbsent(id, k -> storageUnitRepository.findById(k).orElse(null));
    }

    private Facility getFacilityCached(Long id, RequestCache cache) {
        if (id == null) return null;
        if (cache == null) return facilityRepository.findById(id).orElse(null);
        return cache.facilities.computeIfAbsent(id, k -> facilityRepository.findById(k).orElse(null));
    }

    private int resolveCheckinGraceDays(RentalContract c) {
        return resolveCheckinGraceDays(c, null);
    }

    private int resolveCheckinGraceDays(RentalContract c, RequestCache cache) {
        if (cache != null && cache.activeGraceDays != null) {
            return cache.activeGraceDays;
        }
        if (policyVersionRepository != null) {
            Optional<PolicyVersion> active = policyVersionRepository
                    .findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(OffsetDateTime.now());
            if (active.isPresent() && active.get().getCheckinGraceDays() != null) {
                int g = active.get().getCheckinGraceDays();
                if (cache != null) cache.activeGraceDays = g;
                return g;
            }
        }
        int g = com.swp391.selfstorage.policy.service.PolicyNumbers.snapshotInt(
                c != null ? c.getPolicySnapshot() : null, "checkinGraceDays", 10);
        if (cache != null) cache.activeGraceDays = g;
        return g;
    }

    private List<DailyCheckInTaskDto> loadCheckInTasks(Long staffId, LocalDate date, boolean onlyPending) {
        return loadCheckInTasks(staffId, date, onlyPending, new RequestCache());
    }

    private List<DailyCheckInTaskDto> loadCheckInTasks(Long staffId, LocalDate date, boolean onlyPending, RequestCache cache) {
        List<DailyCheckInTaskDto> result = new ArrayList<>();
        Set<Long> processedContractIds = new HashSet<>();
        LocalDate today = LocalDate.now(VN_ZONE);
        boolean isToday = date.isEqual(today);
        boolean isPast = date.isBefore(today);

        List<StaffDailyAssignment> assignments = new ArrayList<>();
        if (isToday) {
            int lookbackDays = Math.max(10, resolveCheckinGraceDays(null, cache));
            List<StaffDailyAssignment> windowList = staffDailyAssignmentRepository.findByStaffIdAndWorkDateBetween(
                    staffId, today.minusDays(lookbackDays), today);
            if (windowList != null) {
                assignments.addAll(windowList);
            }
        } else {
            List<StaffDailyAssignment> dateList = staffDailyAssignmentRepository.findByStaffIdAndWorkDate(staffId, date);
            if (dateList != null) {
                assignments.addAll(dateList);
            }
        }

        for (StaffDailyAssignment a : assignments) {
            if (a.getTaskType() == AssignmentTaskType.HANDOVER && a.getReferenceId() != null) {
                if (processedContractIds.contains(a.getReferenceId())) {
                    continue;
                }
                getContractCached(a.getReferenceId(), cache).ifPresent(c -> {
                    LocalDate workDate = a.getWorkDate() != null ? a.getWorkDate() : c.getStartDate();
                    LocalDate scheduledDate = c.getStartDate() != null ? c.getStartDate() : workDate;
                    LocalDate createdDate = c.getCreatedAt() != null
                            ? c.getCreatedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                            : null;

                    boolean isTerminalState = c.getStatus() == ContractStatus.CLOSED
                            || c.getStatus() == ContractStatus.CANCELLED
                            || c.getStatus() == ContractStatus.TERMINATED;
                    boolean isCompleted = c.getStatus() == ContractStatus.ACTIVE
                            || isTerminalState
                            || c.getCheckinDate() != null;
                    boolean isTodayTask = false;
                    boolean isLatePending = false;

                    if (!isCompleted && c.getStatus() == ContractStatus.PENDING_CHECK_IN) {
                        if (isPast) {
                            // Ngày quá khứ không giữ việc PENDING — mọi việc chưa xong đã tự động dồn sang Hôm nay
                            isTodayTask = false;
                            isLatePending = false;
                        } else if (scheduledDate != null && scheduledDate.isAfter(date)) {
                            // Hẹn nhận kho ở tương lai (hoặc khách đã dời lịch sang tương lai): không thuộc ngày 'date'
                            isTodayTask = false;
                            isLatePending = false;
                        } else if (isToday) {
                            isTodayTask = (scheduledDate != null && scheduledDate.isEqual(date))
                                    || (scheduledDate == null && createdDate != null && createdDate.isEqual(date));
                            isLatePending = !isTodayTask
                                    && scheduledDate != null
                                    && scheduledDate.isBefore(date)
                                    && isWithinGracePeriod(c, date, cache);
                        } else {
                            // Ngày tương lai: chỉ hiện đúng lịch hẹn của ngày đó, không carry-over việc trễ
                            isTodayTask = scheduledDate != null && scheduledDate.isEqual(date);
                        }
                    } else if (isTerminalState) {
                        // Hợp đồng đã đóng/hủy: Hiển thị ở mục 'Đã xong' nếu lịch hẹn nhận thuộc ngày 'date', hoặc ngày đóng/hủy thuộc ngày 'date'
                        LocalDate closedDate = c.getClosedAt() != null
                                ? c.getClosedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                                : null;
                        LocalDate checkinDate = c.getCheckinDate();
                        isTodayTask = (scheduledDate != null && scheduledDate.isEqual(date))
                                || (closedDate != null && closedDate.isEqual(date))
                                || (checkinDate != null && checkinDate.isEqual(date))
                                || (workDate != null && workDate.isEqual(date));
                    } else {
                        LocalDate checkinDate = c.getCheckinDate();
                        isTodayTask = (checkinDate != null && checkinDate.isEqual(date))
                                || (checkinDate == null && workDate != null && workDate.isEqual(date));
                    }

                    if ((isTodayTask || isLatePending) && processedContractIds.add(c.getId())) {
                        if (!onlyPending || !isCompleted) {
                            DailyCheckInTaskDto dto = toCheckInDto(c, cache);
                            if (isLatePending && scheduledDate != null) {
                                dto.setLate(true);
                                long diff = java.time.temporal.ChronoUnit.DAYS.between(scheduledDate, date);
                                dto.setDaysLate((int) Math.max(1, diff));
                            }
                            result.add(dto);
                        }
                    }
                });
            }
        }

        return result;
    }

    private boolean isWithinGracePeriod(RentalContract c, LocalDate date) {
        return isWithinGracePeriod(c, date, null);
    }

    private boolean isWithinGracePeriod(RentalContract c, LocalDate date, RequestCache cache) {
        if (c == null || c.getStartDate() == null) return false;
        int graceDays = resolveCheckinGraceDays(c, cache);
        LocalDate graceDeadline = c.getStartDate().plusDays(Math.max(0, graceDays));
        return !date.isAfter(graceDeadline);
    }

    private List<DailyReturnTaskDto> loadReturnTasks(Long staffId, LocalDate date, boolean onlyPending) {
        return loadReturnTasks(staffId, date, onlyPending, new RequestCache());
    }

    private List<DailyReturnTaskDto> loadReturnTasks(Long staffId, LocalDate date, boolean onlyPending, RequestCache cache) {
        List<DailyReturnTaskDto> result = new ArrayList<>();
        Set<Long> processedContractIds = new HashSet<>();
        LocalDate today = LocalDate.now(VN_ZONE);
        boolean isToday = date.isEqual(today);
        boolean isPast = date.isBefore(today);

        List<StaffDailyAssignment> assignments = new ArrayList<>();
        if (isToday) {
            List<StaffDailyAssignment> windowList = staffDailyAssignmentRepository.findByStaffIdAndWorkDateBetween(
                    staffId, today.minusDays(14), today);
            if (windowList != null) {
                assignments.addAll(windowList);
            }
        } else {
            List<StaffDailyAssignment> dateList = staffDailyAssignmentRepository.findByStaffIdAndWorkDate(staffId, date);
            if (dateList != null) {
                assignments.addAll(dateList);
            }
        }

        for (StaffDailyAssignment a : assignments) {
            if (a.getReferenceId() == null || processedContractIds.contains(a.getReferenceId())) continue;
            boolean isReturnType = a.getTaskType() == AssignmentTaskType.RETURN
                    || a.getTaskType() == AssignmentTaskType.INSPECTION;
            if (!isReturnType) continue;

            getContractCached(a.getReferenceId(), cache).ifPresent(c -> {
                var reqOpt = getReturnRequestCached(c.getId(), cache);
                if (reqOpt.isPresent()
                        && reqOpt.get().getInspectedBy() != null
                        && !reqOpt.get().getInspectedBy().equals(staffId)) {
                    return;
                }

                LocalDate targetReturnDate = c.getReturnDate();
                if (targetReturnDate == null && reqOpt.isPresent() && reqOpt.get().getRequestedReturnDate() != null) {
                    targetReturnDate = reqOpt.get().getRequestedReturnDate();
                }
                LocalDate workDate = a.getWorkDate() != null ? a.getWorkDate() : targetReturnDate;
                if (workDate == null) {
                    workDate = c.getEndDateExclusive();
                }

                LocalDate returnCreatedDate = reqOpt.isPresent() && reqOpt.get().getRequestedAt() != null
                        ? reqOpt.get().getRequestedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                        : targetReturnDate;

                boolean isInspected = reqOpt.isPresent() && reqOpt.get().getInspectedAt() != null;
                boolean isCompleted = c.getStatus() == ContractStatus.RETURNED
                        || c.getStatus() == ContractStatus.CLOSED
                        || isInspected;
                boolean isTodayTask = false;
                boolean isLatePending = false;

                if (!isCompleted) {
                    if (isPast) {
                        // Ngày quá khứ không giữ việc trả kho PENDING — đã dồn sang Hôm nay
                        isTodayTask = false;
                        isLatePending = false;
                    } else if (isToday) {
                        isTodayTask = (workDate != null && workDate.isEqual(date))
                                || (targetReturnDate != null && targetReturnDate.isEqual(date))
                                || (returnCreatedDate != null && returnCreatedDate.isEqual(date));

                        if (!isTodayTask) {
                            if (c.getStatus() == ContractStatus.OVERDUE) {
                                LocalDate overdueBase = c.getEndDateExclusive() != null ? c.getEndDateExclusive() : workDate;
                                isLatePending = overdueBase != null && overdueBase.isBefore(date);
                            } else if (c.getStatus() == ContractStatus.PENDING_RETURN) {
                                LocalDate deadline = targetReturnDate != null ? targetReturnDate : workDate;
                                isLatePending = deadline != null && deadline.isBefore(date);
                            }
                        }
                    } else {
                        // Ngày tương lai: chỉ hiện đúng lịch hẹn trả kho của ngày đó, không carry-over việc trễ
                        isTodayTask = (workDate != null && workDate.isEqual(date))
                                || (targetReturnDate != null && targetReturnDate.isEqual(date));
                    }
                } else {
                    LocalDate inspectedDate = isInspected
                            ? reqOpt.get().getInspectedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                            : null;
                    isTodayTask = (inspectedDate != null && inspectedDate.isEqual(date))
                            || (workDate != null && workDate.isEqual(date) && inspectedDate == null);
                }

                if ((isTodayTask || isLatePending) && processedContractIds.add(c.getId())) {
                    if (!onlyPending || !isCompleted) {
                        DailyReturnTaskDto dto = toReturnDto(c, cache);
                        if (isLatePending) {
                            dto.setLate(true);
                            LocalDate baseDate = (c.getStatus() == ContractStatus.OVERDUE && c.getEndDateExclusive() != null)
                                    ? c.getEndDateExclusive()
                                    : (targetReturnDate != null ? targetReturnDate : workDate);
                            if (baseDate != null) {
                                long diff = java.time.temporal.ChronoUnit.DAYS.between(baseDate, date);
                                dto.setDaysLate((int) Math.max(1, diff));
                            }
                        }
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
                    LocalDate returnCreatedDate = req.getRequestedAt() != null
                            ? req.getRequestedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                            : req.getRequestedReturnDate();
                    LocalDate inspectedDate = req.getInspectedAt() != null
                            ? req.getInspectedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                            : null;
                    boolean isCompleted = req.getInspectedAt() != null;
                    if (isCompleted) {
                        boolean include = (inspectedDate != null && inspectedDate.isEqual(date))
                                || (inspectedDate == null && returnCreatedDate != null && returnCreatedDate.isEqual(date));
                        if (!include) {
                            continue;
                        }
                    }
                    getContractCached(req.getContractId(), cache).ifPresent(c -> {
                        if (c.getStatus() == ContractStatus.TERMINATED && c.getCheckinDate() == null) {
                            return;
                        }
                        boolean isContractCompleted = c.getStatus() == ContractStatus.RETURNED
                                || c.getStatus() == ContractStatus.CLOSED
                                || req.getInspectedAt() != null;
                        boolean include = false;
                        boolean isLate = false;
                        LocalDate targetReturnDate = c.getReturnDate() != null
                                ? c.getReturnDate()
                                : req.getRequestedReturnDate();
                        LocalDate refDate = targetReturnDate != null ? targetReturnDate : returnCreatedDate;
                        if (!isContractCompleted) {
                            if (isPast) {
                                include = false;
                            } else if (isToday) {
                                boolean isTodayRef = refDate != null && refDate.isEqual(date);
                                boolean isLatePending = false;
                                if (!isTodayRef) {
                                    if (c.getStatus() == ContractStatus.OVERDUE && c.getEndDateExclusive() != null) {
                                        isLatePending = c.getEndDateExclusive().isBefore(date);
                                    } else if (refDate != null) {
                                        isLatePending = refDate.isBefore(date);
                                    }
                                }
                                include = isTodayRef || isLatePending;
                                isLate = !isTodayRef && isLatePending;
                            } else {
                                include = refDate != null && refDate.isEqual(date);
                            }
                        } else {
                            include = (inspectedDate != null && inspectedDate.isEqual(date))
                                    || (inspectedDate == null && returnCreatedDate != null && returnCreatedDate.isEqual(date));
                        }
                        if (include && processedContractIds.add(c.getId())) {
                            if (!onlyPending || !isContractCompleted) {
                                DailyReturnTaskDto dto = toReturnDto(c, cache);
                                if (isLate) {
                                    dto.setLate(true);
                                    LocalDate baseDate = (c.getStatus() == ContractStatus.OVERDUE && c.getEndDateExclusive() != null)
                                            ? c.getEndDateExclusive()
                                            : refDate;
                                    if (baseDate != null) {
                                        long diff = java.time.temporal.ChronoUnit.DAYS.between(baseDate, date);
                                        dto.setDaysLate((int) Math.max(1, diff));
                                    }
                                }
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
        return loadSupportTasks(staffId, date, onlyPending, new RequestCache());
    }

    private List<DailySupportTaskDto> loadSupportTasks(Long staffId, LocalDate date, boolean onlyPending, RequestCache cache) {
        List<DailySupportTaskDto> result = new ArrayList<>();
        Set<Long> processedRequestIds = new HashSet<>();
        LocalDate today = LocalDate.now(VN_ZONE);
        boolean isToday = date.isEqual(today);
        boolean isPast = date.isBefore(today);

        // Sự cố được phân công trực tiếp cho staff
        List<SupportRequest> assignedRequests = supportRequestRepository.findAllByAssignedStaffId(staffId);
        for (SupportRequest sr : assignedRequests) {
            // Loại bỏ ticket bàn giao tiếp đón (đây là nhiệm vụ đổi ô của FM, không phải task sự cố của staff)
            if (sr.getCode() != null && (sr.getCode().startsWith("INC-HD-") || sr.getCode().startsWith("INC-REASSIGN-"))) {
                continue;
            }
            if (sr.getDescription() != null && sr.getDescription().startsWith("Sự cố bàn giao tiếp đón")) {
                continue;
            }
            boolean isCompleted = isSupportWorkDone(sr, cache);
            boolean include;
            LocalDate createdDate = sr.getCreatedAt() != null
                    ? sr.getCreatedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                    : null;
            LocalDate resolvedDate = sr.getResolvedAt() != null
                    ? sr.getResolvedAt().atZoneSameInstant(VN_ZONE).toLocalDate()
                    : null;

            if (!isCompleted) {
                if (isPast) {
                    // Ngày quá khứ không giữ sự cố PENDING — sự cố chưa xong luôn nằm ở ca trực Hôm nay
                    include = false;
                } else if (isToday) {
                    include = createdDate == null || !createdDate.isAfter(date);
                } else {
                    include = createdDate != null && createdDate.isEqual(date);
                }
            } else {
                include = (resolvedDate != null && resolvedDate.isEqual(date))
                        || (resolvedDate == null && createdDate != null && createdDate.isEqual(date));
            }
            if (include && processedRequestIds.add(sr.getId())) {
                if (!onlyPending || !isCompleted) {
                    result.add(toSupportDto(sr, cache));
                }
            }
        }

        // Nhiệm vụ phân công cụ thể qua staff_daily_assignment (SUPPORT)
        List<StaffDailyAssignment> assignments = staffDailyAssignmentRepository.findByStaffIdAndWorkDate(staffId, date);
        for (StaffDailyAssignment a : assignments) {
            if (a.getTaskType() == AssignmentTaskType.SUPPORT && a.getReferenceId() != null) {
                if (processedRequestIds.add(a.getReferenceId())) {
                    supportRequestRepository.findById(a.getReferenceId()).ifPresent(sr -> {
                        if (sr.getCode() != null && (sr.getCode().startsWith("INC-HD-") || sr.getCode().startsWith("INC-REASSIGN-"))) {
                            return;
                        }
                        if (sr.getDescription() != null && sr.getDescription().startsWith("Sự cố bàn giao tiếp đón")) {
                            return;
                        }
                        boolean isCompleted = isSupportWorkDone(sr, cache);
                        if (isPast && !isCompleted) {
                            return;
                        }
                        if (!onlyPending || !isCompleted) {
                            result.add(toSupportDto(sr, cache));
                        }
                    });
                }
            }
        }

        return result;
    }

    private DailyCheckInTaskDto toCheckInDto(RentalContract c) {
        return toCheckInDto(c, null);
    }

    private DailyCheckInTaskDto toCheckInDto(RentalContract c, RequestCache cache) {
        boolean isTerminalState = c.getStatus() == ContractStatus.CLOSED
                || c.getStatus() == ContractStatus.CANCELLED
                || c.getStatus() == ContractStatus.TERMINATED;
        boolean completed = c.getStatus() == ContractStatus.ACTIVE || isTerminalState || c.getCheckinDate() != null;
        String status;
        if (c.getStatus() == ContractStatus.ACTIVE || c.getCheckinDate() != null) {
            status = "COMPLETED";
        } else if (c.getStatus() == ContractStatus.TERMINATED) {
            status = "TERMINATED";
        } else if (c.getStatus() == ContractStatus.CLOSED) {
            status = "CLOSED";
        } else if (c.getStatus() == ContractStatus.CANCELLED) {
            status = "CANCELLED";
        } else {
            status = "PENDING";
        }

        String customerName = null;
        String customerPhone = null;
        if (c.getCustomerId() != null) {
            AppUser user = getUserCached(c.getCustomerId(), cache);
            if (user != null) {
                customerName = user.getFullName();
                customerPhone = user.getPhone();
            }
        }

        String unitCode = null;
        if (c.getStorageUnitId() != null) {
            StorageUnit unit = getUnitCached(c.getStorageUnitId(), cache);
            if (unit != null) {
                unitCode = unit.getCode();
            }
        }

        String facilityName = null;
        if (c.getFacilityId() != null) {
            Facility facility = getFacilityCached(c.getFacilityId(), cache);
            if (facility != null) {
                facilityName = facility.getName();
            }
        }

        String conditionNote = null;
        java.time.OffsetDateTime handoverAt = null;
        boolean isOnline = false;

        var hrOpt = getHandoverRecordCached(c.getId(), cache);
        if (hrOpt.isPresent()) {
            var hr = hrOpt.get();
            conditionNote = hr.getConditionNote();
            handoverAt = hr.getHandoverAt();
            isOnline = (conditionNote != null && (conditionNote.toLowerCase().contains("online") || conditionNote.toLowerCase().contains("ký số")))
                    || (hr.getStaffId() == null && hr.isCustomerConfirmed())
                    || (hr.getStaffId() != null && Objects.equals(hr.getStaffId(), c.getCustomerId()));
        }

        if (c.isDoubleDepositCompensation()) {
            long totalPayout = c.getTotalRentalFee() + 2 * c.getDepositAmount();
            java.text.NumberFormat nf = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN"));
            conditionNote = "Cháy kho 100% · Bồi thường phạt cọc gấp đôi (Đ.328 BLDS): " + nf.format(totalPayout) + " đ";
        } else if ((c.getStatus() == ContractStatus.CLOSED || c.getStatus() == ContractStatus.CANCELLED) && conditionNote == null) {
            long refundAmount = 0;
            if (paymentTransactionRepository != null) {
                try {
                    var txs = paymentTransactionRepository.findByContractId(c.getId());
                    if (txs != null) {
                        for (var tx : txs) {
                            if ("SUCCESS".equalsIgnoreCase(tx.getStatus())
                                    && tx.getTransactionType() != null
                                    && tx.getTransactionType().toUpperCase().contains("REFUND")) {
                                refundAmount += tx.getAmount() != null ? tx.getAmount() : 0;
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
            if (refundAmount > 0) {
                java.text.NumberFormat nf = java.text.NumberFormat.getInstance(new java.util.Locale("vi", "VN"));
                conditionNote = "Khách hủy nhận kho · Đã hoàn tiền " + nf.format(refundAmount) + " đ";
            } else {
                conditionNote = "Hợp đồng đã kết thúc · Đã xử lý hủy và hoàn tất thủ tục";
            }
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
                .checkinGraceDays(resolveCheckinGraceDays(c, cache))
                .isOnlineCheckIn(isOnline)
                .conditionNote(conditionNote)
                .handoverAt(handoverAt)
                .isDoubleDepositCompensation(c.isDoubleDepositCompensation())
                .compensationAmount(c.getCompensationAmount())
                .build();
        dto.setScheduledStartTime(c.getScheduledStartTime());
        dto.setScheduledEndTime(c.getScheduledEndTime());
        return dto;
    }

    private DailyReturnTaskDto toReturnDto(RentalContract c) {
        return toReturnDto(c, null);
    }

    private DailyReturnTaskDto toReturnDto(RentalContract c, RequestCache cache) {
        var reqOpt = returnRequestRepository != null
                ? getReturnRequestCached(c.getId(), cache)
                : Optional.<com.swp391.selfstorage.contract.entity.ReturnRequest>empty();
        boolean isInspected = reqOpt.isPresent() && reqOpt.get().getInspectedAt() != null;
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
            AppUser user = getUserCached(c.getCustomerId(), cache);
            if (user != null) {
                customerName = user.getFullName();
                customerPhone = user.getPhone();
            }
        }

        String unitCode = null;
        if (c.getStorageUnitId() != null) {
            StorageUnit unit = getUnitCached(c.getStorageUnitId(), cache);
            if (unit != null) {
                unitCode = unit.getCode();
            }
        }

        String facilityName = null;
        if (c.getFacilityId() != null) {
            Facility facility = getFacilityCached(c.getFacilityId(), cache);
            if (facility != null) {
                facilityName = facility.getName();
            }
        }

        LocalDate effectiveReturnDate = c.getReturnDate();
        if (effectiveReturnDate == null && reqOpt.isPresent() && reqOpt.get().getRequestedReturnDate() != null) {
            effectiveReturnDate = reqOpt.get().getRequestedReturnDate();
        }
        if (effectiveReturnDate == null) {
            effectiveReturnDate = c.getEndDateExclusive();
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
                .scheduledDate(effectiveReturnDate)
                .returnDate(effectiveReturnDate)
                .status(status)
                .completed(completed)
                .build();
    }

    private boolean isSupportWorkDone(SupportRequest sr, RequestCache cache) {
        if (sr.getStatus() == SupportStatus.RESOLVED
                || sr.getStatus() == SupportStatus.CLOSED
                || sr.getStatus() == SupportStatus.AUTO_CLOSED) {
            return true;
        }
        if (sr.getContractId() == null) {
            return false;
        }
        return getContractCached(sr.getContractId(), cache)
                .map(c -> c.getStatus() == ContractStatus.CLOSED
                        || c.getStatus() == ContractStatus.TERMINATED
                        || c.getStatus() == ContractStatus.CANCELLED
                        || c.getStatus() == ContractStatus.RETURNED)
                .orElse(false);
    }

    private DailySupportTaskDto toSupportDto(SupportRequest sr) {
        return toSupportDto(sr, null);
    }

    private DailySupportTaskDto toSupportDto(SupportRequest sr, RequestCache cache) {
        boolean completed = isSupportWorkDone(sr, cache);

        String unitCode = null;
        Long facilityId = null;
        if (sr.getStorageUnitId() != null) {
            StorageUnit unit = getUnitCached(sr.getStorageUnitId(), cache);
            if (unit != null) {
                unitCode = unit.getCode();
                facilityId = unit.getFacilityId();
            }
        }

        if (facilityId == null && sr.getContractId() != null) {
            facilityId = rentalContractRepository.findById(sr.getContractId())
                    .map(RentalContract::getFacilityId)
                    .orElse(null);
        }

        String facilityName = null;
        if (facilityId != null) {
            Facility facility = getFacilityCached(facilityId, cache);
            if (facility != null) {
                facilityName = facility.getName();
            }
        }
        String customerName = null;
        String customerPhone = null;
        if (sr.getCustomerId() != null) {
            AppUser user = getUserCached(sr.getCustomerId(), cache);
            if (user != null) {
                customerName = user.getFullName();
                customerPhone = user.getPhone();
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
