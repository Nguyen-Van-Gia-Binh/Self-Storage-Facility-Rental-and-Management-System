package com.swp391.selfstorage.support.service.impl;

import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.support.dto.AssignStaffRequest;
import com.swp391.selfstorage.support.dto.TaskAssignmentRequest;
import com.swp391.selfstorage.support.dto.TaskAssignmentResponse;
import com.swp391.selfstorage.support.entity.AssignmentTaskType;
import com.swp391.selfstorage.support.entity.StaffDailyAssignment;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.support.service.StaffAssignmentService;
import com.swp391.selfstorage.support.service.StaffSupportService;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaffAssignmentServiceImpl implements StaffAssignmentService {

    private final UserRepository userRepository;
    private final RentalContractRepository rentalContractRepository;
    private final StaffDailyAssignmentRepository staffDailyAssignmentRepository;
    private final StaffSupportService staffSupportService;
    private final com.swp391.selfstorage.contract.repository.ReturnRequestRepository returnRequestRepository;

    @Override
    @Transactional
    public TaskAssignmentResponse assignStaff(TaskAssignmentRequest request, UserPrincipal currentUser) {
        Long staffId = request.getResolvedStaffId();
        if (staffId == null) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Vui lòng chọn nhân viên phụ trách ca trực");
        }

        AppUser staff = userRepository.findById(staffId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy nhân viên với ID: " + staffId));

        Long assignedBy = currentUser != null ? currentUser.getId() : 1L;
        String taskTypeStr = request.getTaskType() != null ? request.getTaskType().toUpperCase() : "GENERAL";
        Long rawTaskId = request.getTaskId();
        Long contractId = request.getContractId();

        // Xử lý task ID của frontend nếu được offset theo loại việc (100000+ cho check-in, 200000+ cho return)
        if (contractId == null && rawTaskId != null) {
            if ("CHECK_IN".equals(taskTypeStr) && rawTaskId > 100000) {
                contractId = rawTaskId - 100000;
            } else if ("RETURN".equals(taskTypeStr) && rawTaskId > 200000) {
                contractId = rawTaskId - 200000;
            }
        }

        Long targetFacilityId = 1L;
        AssignmentTaskType assignmentType = AssignmentTaskType.SUPPORT;

        if ("CHECK_IN".equals(taskTypeStr)) {
            assignmentType = AssignmentTaskType.HANDOVER;
            if (contractId != null) {
                RentalContract contract = rentalContractRepository.findById(contractId).orElse(null);
                if (contract != null) {
                    targetFacilityId = contract.getFacilityId();
                }
            }
        } else if ("RETURN".equals(taskTypeStr)) {
            assignmentType = AssignmentTaskType.RETURN;
            if (contractId != null) {
                RentalContract contract = rentalContractRepository.findById(contractId).orElse(null);
                if (contract != null) {
                    targetFacilityId = contract.getFacilityId();
                }
                if (returnRequestRepository != null) {
                    var reqOpt = returnRequestRepository.findTopByContractIdOrderByCreatedAtDesc(contractId);
                    if (reqOpt.isPresent()) {
                        var retReq = reqOpt.get();
                        retReq.setInspectedBy(staffId);
                        if (request.getNotes() != null && !request.getNotes().isBlank()) {
                            String curNote = retReq.getConditionNote() != null ? retReq.getConditionNote() : "";
                            retReq.setConditionNote((curNote + " [Phân công]: " + request.getNotes()).trim());
                        }
                        returnRequestRepository.save(retReq);
                        log.info("Đã gán inspectedBy={} cho return request của hợp đồng #{}", staffId, contractId);
                    }
                }
            }
        } else if ("INCIDENT".equals(taskTypeStr) || "SUPPORT".equals(taskTypeStr)) {
            assignmentType = AssignmentTaskType.SUPPORT;
            if (rawTaskId != null) {
                try {
                    staffSupportService.assignStaff(
                            rawTaskId,
                            new AssignStaffRequest(staffId, request.getResolvedInstructions()),
                            currentUser
                    );
                } catch (Exception ex) {
                    log.warn("Gọi staffSupportService.assignStaff thất bại cho ticket #{}: {}", rawTaskId, ex.getMessage());
                }
            }
        }

        // Lưu hoặc cập nhật bản ghi vào bảng staff_daily_assignment
        String refType = contractId != null ? "CONTRACT" : "SUPPORT_REQUEST";
        Long refId = contractId != null ? contractId : (rawTaskId != null ? rawTaskId : 0L);

        StaffDailyAssignment assignment = staffDailyAssignmentRepository
                .findByReferenceTypeAndReferenceId(refType, refId)
                .orElseGet(() -> StaffDailyAssignment.builder()
                        .facilityId(targetFacilityId)
                        .workDate(LocalDate.now())
                        .taskType(assignmentType)
                        .referenceType(refType)
                        .referenceId(refId)
                        .createdAt(OffsetDateTime.now())
                        .build());

        assignment.setStaffId(staffId);
        assignment.setFacilityId(targetFacilityId);
        assignment.setAssignedBy(assignedBy);
        assignment.setTaskType(assignmentType);
        assignment.setWorkDate(LocalDate.now());

        staffDailyAssignmentRepository.save(assignment);
        log.info("Phân công nhân viên {} (ID: {}) cho nhiệm vụ {} (ref: {} #{}) thành công",
                staff.getFullName(), staffId, taskTypeStr, refType, refId);

        return TaskAssignmentResponse.builder()
                .success(true)
                .message("Phân công nhiệm vụ thành công cho nhân viên " + staff.getFullName())
                .taskId(rawTaskId)
                .taskType(taskTypeStr)
                .assignedStaffId(staffId)
                .assignedStaffName(staff.getFullName())
                .status("ASSIGNED")
                .assignedAt(OffsetDateTime.now())
                .build();
    }
}
