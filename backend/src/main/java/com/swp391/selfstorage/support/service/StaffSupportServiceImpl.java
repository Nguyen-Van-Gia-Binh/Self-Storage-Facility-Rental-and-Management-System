package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.support.dto.AssignStaffRequest;
import com.swp391.selfstorage.support.dto.ResolveSupportRequest;
import com.swp391.selfstorage.support.dto.StaffWorkloadResponse;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.*;
import com.swp391.selfstorage.support.repository.AttachmentRepository;
import com.swp391.selfstorage.support.repository.StaffDailyAssignmentRepository;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserFacilityAssignment;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import com.swp391.selfstorage.user.repository.UserFacilityAssignmentRepository;
import com.swp391.selfstorage.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class StaffSupportServiceImpl implements StaffSupportService {

    private final SupportRequestRepository supportRequestRepository;
    private final StaffDailyAssignmentRepository staffDailyAssignmentRepository;
    private final AttachmentRepository attachmentRepository;
    private final RentalContractRepository rentalContractRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final UserFacilityAssignmentRepository userFacilityAssignmentRepository;

    public StaffSupportServiceImpl(
            SupportRequestRepository supportRequestRepository,
            StaffDailyAssignmentRepository staffDailyAssignmentRepository,
            AttachmentRepository attachmentRepository,
            RentalContractRepository rentalContractRepository,
            StorageUnitRepository storageUnitRepository,
            FacilityRepository facilityRepository,
            UserRepository userRepository,
            UserFacilityAssignmentRepository userFacilityAssignmentRepository
    ) {
        this.supportRequestRepository = supportRequestRepository;
        this.staffDailyAssignmentRepository = staffDailyAssignmentRepository;
        this.attachmentRepository = attachmentRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
        this.userFacilityAssignmentRepository = userFacilityAssignmentRepository;
    }

    @Override
    public SupportRequestDetailResponse assignStaff(Long requestId, AssignStaffRequest request, UserPrincipal currentUser) {
        SupportRequest ticket = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_FOUND));

        Long facilityId = resolveFacilityId(ticket);

        // Kiểm tra phân quyền: Facility Manager chỉ được phân công cơ sở của mình
        if (currentUser.getRole() == UserRole.FACILITY_MANAGER) {
            if (facilityId != null && (currentUser.getFacilityIds() == null || !currentUser.getFacilityIds().contains(facilityId))) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không quản lý cơ sở của yêu cầu hỗ trợ này");
            }
        }

        // Kiểm tra nhân viên được gán
        AppUser staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new CustomException(ErrorCode.STAFF_NOT_FOUND));

        if (staff.getRole() != UserRole.FACILITY_STAFF) {
            throw new CustomException(ErrorCode.STAFF_NOT_FOUND, "Người dùng không phải nhân viên cơ sở");
        }
        if (staff.getStatus() != UserStatus.ACTIVE) {
            throw new CustomException(ErrorCode.STAFF_NOT_ACTIVE);
        }

        // Kiểm tra nhân viên có thuộc cùng cơ sở không
        if (facilityId != null) {
            List<UserFacilityAssignment> assignments = userFacilityAssignmentRepository.findByUserId(staff.getId());
            boolean belongsToFacility = assignments != null && assignments.stream()
                    .anyMatch(a -> facilityId.equals(a.getFacilityId()));
            if (!belongsToFacility) {
                throw new CustomException(ErrorCode.STAFF_NOT_IN_FACILITY);
            }
        }

        // Cập nhật ticket
        ticket.setAssignedStaffId(staff.getId());
        ticket.setStatus(SupportStatus.ASSIGNED);
        ticket.setUpdatedAt(OffsetDateTime.now());
        supportRequestRepository.save(ticket);

        // Lưu bảng phân công công việc hằng ngày
        StaffDailyAssignment dailyAssignment = StaffDailyAssignment.builder()
                .staffId(staff.getId())
                .facilityId(facilityId != null ? facilityId : 1L)
                .workDate(LocalDate.now())
                .taskType(AssignmentTaskType.SUPPORT)
                .referenceType("SUPPORT_REQUEST")
                .referenceId(ticket.getId())
                .assignedBy(currentUser.getId())
                .createdAt(OffsetDateTime.now())
                .build();
        staffDailyAssignmentRepository.save(dailyAssignment);

        return mapToDetailResponse(ticket);
    }

    @Override
    public SupportRequestDetailResponse startInProgress(Long requestId, UserPrincipal currentUser) {
        SupportRequest ticket = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_FOUND));

        // Kiểm tra phân quyền: Staff chỉ được xử lý ticket phân công cho mình
        if (currentUser.getRole() == UserRole.FACILITY_STAFF) {
            if (ticket.getAssignedStaffId() != null && !ticket.getAssignedStaffId().equals(currentUser.getId())) {
                throw new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_ASSIGNED_TO_STAFF);
            }
        }

        ticket.setStatus(SupportStatus.IN_PROGRESS);
        ticket.setUpdatedAt(OffsetDateTime.now());
        supportRequestRepository.save(ticket);

        return mapToDetailResponse(ticket);
    }

    @Override
    public SupportRequestDetailResponse resolveSupportRequest(Long requestId, ResolveSupportRequest request, UserPrincipal currentUser) {
        SupportRequest ticket = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_FOUND));

        // Kiểm tra phân quyền
        if (currentUser.getRole() == UserRole.FACILITY_STAFF) {
            if (ticket.getAssignedStaffId() != null && !ticket.getAssignedStaffId().equals(currentUser.getId())) {
                throw new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_ASSIGNED_TO_STAFF);
            }
        }

        // Chỉ cho phép resolve khi ticket ở trạng thái ASSIGNED hoặc IN_PROGRESS
        if (ticket.getStatus() != SupportStatus.ASSIGNED && ticket.getStatus() != SupportStatus.IN_PROGRESS) {
            throw new CustomException(ErrorCode.SUPPORT_REQUEST_CANNOT_BE_RESOLVED);
        }

        if (request.getResolutionAttachmentUrls() != null && request.getResolutionAttachmentUrls().size() > 5) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED, "Tối đa 5 ảnh hiện trạng sau sửa chữa");
        }

        ticket.setStatus(SupportStatus.RESOLVED);
        ticket.setResolutionNote(request.getResolutionNote());
        ticket.setResolvedAt(OffsetDateTime.now());
        ticket.setUpdatedAt(OffsetDateTime.now());
        supportRequestRepository.save(ticket);

        // Lưu ảnh hiện trạng sau xử lý
        if (request.getResolutionAttachmentUrls() != null && !request.getResolutionAttachmentUrls().isEmpty()) {
            List<Attachment> attachments = request.getResolutionAttachmentUrls().stream()
                    .map(url -> Attachment.builder()
                            .entityType("SUPPORT_RESOLUTION")
                            .entityId(ticket.getId())
                            .fileUrl(url)
                            .uploadedBy(currentUser.getId())
                            .createdAt(OffsetDateTime.now())
                            .build())
                    .toList();
            attachmentRepository.saveAll(attachments);
        }

        return mapToDetailResponse(ticket, request.getResolutionAttachmentUrls());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffWorkloadResponse> getStaffWorkload(Long facilityId, UserPrincipal currentUser) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new CustomException(ErrorCode.FACILITY_NOT_FOUND));

        if (currentUser.getRole() == UserRole.FACILITY_MANAGER) {
            if (currentUser.getFacilityIds() == null || !currentUser.getFacilityIds().contains(facilityId)) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không quản lý cơ sở này");
            }
        }

        List<AppUser> allStaff = userRepository.findByFilters(null, UserRole.FACILITY_STAFF, UserStatus.ACTIVE, Pageable.unpaged()).getContent();
        List<StaffWorkloadResponse> workloadList = new ArrayList<>();

        for (AppUser staff : allStaff) {
            List<UserFacilityAssignment> assignments = userFacilityAssignmentRepository.findByUserId(staff.getId());
            boolean belongsToFacility = assignments != null && assignments.stream()
                    .anyMatch(a -> facilityId.equals(a.getFacilityId()));

            if (belongsToFacility) {
                long activeTasks = supportRequestRepository.countByAssignedStaffIdAndStatusIn(
                        staff.getId(), List.of(SupportStatus.ASSIGNED, SupportStatus.IN_PROGRESS)
                );
                long completedTasks = supportRequestRepository.countByAssignedStaffIdAndStatus(
                        staff.getId(), SupportStatus.RESOLVED
                ) + supportRequestRepository.countByAssignedStaffIdAndStatus(
                        staff.getId(), SupportStatus.CLOSED
                );

                workloadList.add(StaffWorkloadResponse.builder()
                        .staffId(staff.getId())
                        .staffName(staff.getFullName())
                        .staffEmail(staff.getEmail())
                        .staffPhone(staff.getPhone())
                        .facilityId(facility.getId())
                        .facilityName(facility.getName())
                        .activeTaskCount(activeTasks)
                        .completedTaskCount(completedTasks)
                        .build());
            }
        }

        return workloadList;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupportRequestSummaryResponse> getManagementSupportRequests(
            Long facilityId, SupportStatus status, SupportCategory category,
            Long assignedStaffId, Pageable pageable, UserPrincipal currentUser
    ) {
        Page<SupportRequest> page;

        if (currentUser.getRole() == UserRole.FACILITY_MANAGER) {
            List<Long> managerFacilityIds = currentUser.getFacilityIds();
            if (facilityId != null) {
                if (managerFacilityIds == null || !managerFacilityIds.contains(facilityId)) {
                    throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không quản lý cơ sở này");
                }
                managerFacilityIds = List.of(facilityId);
            }
            page = supportRequestRepository.findByFacilityIdsAndFilters(
                    managerFacilityIds, status, category, assignedStaffId, pageable
            );
        } else if (currentUser.getRole() == UserRole.FACILITY_STAFF) {
            List<Long> staffFacilityIds = currentUser.getFacilityIds();
            page = supportRequestRepository.findByFacilityIdsAndFilters(
                    staffFacilityIds, status, category, assignedStaffId != null ? assignedStaffId : currentUser.getId(), pageable
            );
        } else {
            // ADMIN / BUSINESS_MANAGER xem toàn bộ
            page = supportRequestRepository.findAllManagementRequests(
                    facilityId, status, category, assignedStaffId, pageable
            );
        }

        List<SupportRequestSummaryResponse> content = page.getContent().stream()
                .map(this::mapToSummaryResponse)
                .toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SupportRequestDetailResponse getManagementSupportRequestDetail(Long requestId, UserPrincipal currentUser) {
        SupportRequest ticket = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_FOUND));

        Long facilityId = resolveFacilityId(ticket);

        if (currentUser.getRole() == UserRole.FACILITY_MANAGER) {
            if (facilityId != null && (currentUser.getFacilityIds() == null || !currentUser.getFacilityIds().contains(facilityId))) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "Bạn không quản lý cơ sở của yêu cầu hỗ trợ này");
            }
        }

        return mapToDetailResponse(ticket);
    }

    private Long resolveFacilityId(SupportRequest ticket) {
        if (ticket.getContractId() != null) {
            RentalContract contract = rentalContractRepository.findById(ticket.getContractId()).orElse(null);
            if (contract != null) {
                return contract.getFacilityId();
            }
        }
        if (ticket.getStorageUnitId() != null) {
            StorageUnit unit = storageUnitRepository.findById(ticket.getStorageUnitId()).orElse(null);
            if (unit != null) {
                return unit.getFacilityId();
            }
        }
        return null;
    }

    private SupportRequestDetailResponse mapToDetailResponse(SupportRequest ticket) {
        return mapToDetailResponse(ticket, null);
    }

    private SupportRequestDetailResponse mapToDetailResponse(SupportRequest ticket, List<String> resolutionAttachmentUrlsOverride) {
        String facilityName = null;
        String contractCode = null;
        String storageUnitCode = null;

        if (ticket.getContractId() != null) {
            RentalContract contract = rentalContractRepository.findById(ticket.getContractId()).orElse(null);
            if (contract != null) {
                contractCode = contract.getCode();
                if (contract.getFacilityId() != null) {
                    facilityName = facilityRepository.findById(contract.getFacilityId())
                            .map(Facility::getName).orElse(null);
                }
            }
        }
        if (ticket.getStorageUnitId() != null) {
            StorageUnit unit = storageUnitRepository.findById(ticket.getStorageUnitId()).orElse(null);
            if (unit != null) {
                storageUnitCode = unit.getCode();
                if (facilityName == null && unit.getFacilityId() != null) {
                    facilityName = facilityRepository.findById(unit.getFacilityId())
                            .map(Facility::getName).orElse(null);
                }
            }
        }

        String assignedStaffName = null;
        String assignedStaffPhone = null;
        if (ticket.getAssignedStaffId() != null) {
            AppUser staff = userRepository.findById(ticket.getAssignedStaffId()).orElse(null);
            if (staff != null) {
                assignedStaffName = staff.getFullName();
                assignedStaffPhone = staff.getPhone();
            }
        }

        List<String> attachmentUrls = attachmentRepository
                .findByEntityTypeAndEntityId("SUPPORT_REQUEST", ticket.getId())
                .stream()
                .map(Attachment::getFileUrl)
                .toList();

        List<String> resolutionAttachmentUrls = resolutionAttachmentUrlsOverride != null
                ? resolutionAttachmentUrlsOverride
                : attachmentRepository
                        .findByEntityTypeAndEntityId("SUPPORT_RESOLUTION", ticket.getId())
                        .stream()
                        .map(Attachment::getFileUrl)
                        .toList();

        boolean canCancel = ticket.getStatus() == SupportStatus.NEW;
        boolean canConfirm = ticket.getStatus() == SupportStatus.RESOLVED;

        return SupportRequestDetailResponse.builder()
                .id(ticket.getId())
                .code(ticket.getCode())
                .customerId(ticket.getCustomerId())
                .contractId(ticket.getContractId())
                .contractCode(contractCode)
                .storageUnitId(ticket.getStorageUnitId())
                .storageUnitCode(storageUnitCode)
                .facilityName(facilityName)
                .category(ticket.getCategory())
                .categoryDisplayName(ticket.getCategory() != null ? ticket.getCategory().getDisplayName() : null)
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .statusDisplayName(ticket.getStatus() != null ? ticket.getStatus().getDisplayName() : null)
                .isUrgent(ticket.isUrgent())
                .assignedStaffId(ticket.getAssignedStaffId())
                .assignedStaffName(assignedStaffName)
                .assignedStaffPhone(assignedStaffPhone)
                .slaDueAt(ticket.getSlaDueAt())
                .resolvedAt(ticket.getResolvedAt())
                .resolutionNote(ticket.getResolutionNote())
                .customerConfirmedAt(ticket.getCustomerConfirmedAt())
                .autoClosedAt(ticket.getAutoClosedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .attachmentUrls(attachmentUrls)
                .resolutionAttachmentUrls(resolutionAttachmentUrls)
                .canCancel(canCancel)
                .canConfirm(canConfirm)
                .build();
    }

    private SupportRequestSummaryResponse mapToSummaryResponse(SupportRequest ticket) {
        String facilityName = null;
        String contractCode = null;
        String storageUnitCode = null;

        if (ticket.getContractId() != null) {
            RentalContract contract = rentalContractRepository.findById(ticket.getContractId()).orElse(null);
            if (contract != null) {
                contractCode = contract.getCode();
                if (contract.getFacilityId() != null) {
                    facilityName = facilityRepository.findById(contract.getFacilityId())
                            .map(Facility::getName).orElse(null);
                }
            }
        }
        if (ticket.getStorageUnitId() != null) {
            StorageUnit unit = storageUnitRepository.findById(ticket.getStorageUnitId()).orElse(null);
            if (unit != null) {
                storageUnitCode = unit.getCode();
                if (facilityName == null && unit.getFacilityId() != null) {
                    facilityName = facilityRepository.findById(unit.getFacilityId())
                            .map(Facility::getName).orElse(null);
                }
            }
        }

        String assignedStaffName = null;
        if (ticket.getAssignedStaffId() != null) {
            AppUser staff = userRepository.findById(ticket.getAssignedStaffId()).orElse(null);
            if (staff != null) {
                assignedStaffName = staff.getFullName();
            }
        }

        return SupportRequestSummaryResponse.builder()
                .id(ticket.getId())
                .code(ticket.getCode())
                .customerId(ticket.getCustomerId())
                .contractId(ticket.getContractId())
                .contractCode(contractCode)
                .storageUnitId(ticket.getStorageUnitId())
                .storageUnitCode(storageUnitCode)
                .facilityName(facilityName)
                .category(ticket.getCategory())
                .categoryDisplayName(ticket.getCategory() != null ? ticket.getCategory().getDisplayName() : null)
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .statusDisplayName(ticket.getStatus() != null ? ticket.getStatus().getDisplayName() : null)
                .isUrgent(ticket.isUrgent())
                .assignedStaffId(ticket.getAssignedStaffId())
                .assignedStaffName(assignedStaffName)
                .slaDueAt(ticket.getSlaDueAt())
                .resolvedAt(ticket.getResolvedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
