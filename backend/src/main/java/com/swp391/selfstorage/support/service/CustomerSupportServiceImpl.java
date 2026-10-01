package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.contract.entity.RentalContract;
import com.swp391.selfstorage.contract.repository.RentalContractRepository;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.facility.entity.Facility;
import com.swp391.selfstorage.facility.repository.FacilityRepository;
import com.swp391.selfstorage.support.dto.ConfirmResolutionRequest;
import com.swp391.selfstorage.support.dto.CreateSupportRequest;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.Attachment;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportRequest;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.repository.AttachmentRepository;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import com.swp391.selfstorage.unit.entity.StorageUnit;
import com.swp391.selfstorage.unit.repository.StorageUnitRepository;
import com.swp391.selfstorage.user.entity.AppUser;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerSupportServiceImpl implements CustomerSupportService {

    private final SupportRequestRepository supportRequestRepository;
    private final AttachmentRepository attachmentRepository;
    private final RentalContractRepository rentalContractRepository;
    private final StorageUnitRepository storageUnitRepository;
    private final FacilityRepository facilityRepository;
    private final UserRepository userRepository;
    private final PolicyVersionRepository policyVersionRepository;

    public CustomerSupportServiceImpl(
            SupportRequestRepository supportRequestRepository,
            AttachmentRepository attachmentRepository,
            RentalContractRepository rentalContractRepository,
            StorageUnitRepository storageUnitRepository,
            FacilityRepository facilityRepository,
            UserRepository userRepository,
            PolicyVersionRepository policyVersionRepository
    ) {
        this.supportRequestRepository = supportRequestRepository;
        this.attachmentRepository = attachmentRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.storageUnitRepository = storageUnitRepository;
        this.facilityRepository = facilityRepository;
        this.userRepository = userRepository;
        this.policyVersionRepository = policyVersionRepository;
    }

    private static final String ENTITY_TYPE_SUPPORT = "SUPPORT_REQUEST";

    @Override
    @Transactional
    public SupportRequestDetailResponse createSupportRequest(CreateSupportRequest request, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        if (request.getAttachmentUrls() != null && request.getAttachmentUrls().size() > 5) {
            throw new CustomException(ErrorCode.VALIDATION_FAILED);
        }

        Long customerId = currentUser.getId();
        OffsetDateTime now = OffsetDateTime.now();

        // 1. Tự động sinh mã phiếu: SUP-YYYYMM-XXXX
        String monthPrefix = "SUP-" + now.format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        long seq = supportRequestRepository.countByCodeStartingWith(monthPrefix) + 1;
        String code = String.format("%s%04d", monthPrefix, seq);

        // Quyết định nghiệp vụ (BR-SUP-01 - 01/10/2026): Bãi bỏ cam kết SLA cứng 2 giờ/24 giờ và đồng hồ đếm ngược.
        // Hỗ trợ xử lý linh hoạt theo ca trực cơ sở; slaDueAt để null và isUrgent theo request (mặc định false).
        boolean isUrgent = Boolean.TRUE.equals(request.getIsUrgent());
        OffsetDateTime slaDueAt = null;

        // 3. Nếu có contractId, tự động điền storageUnitId nếu chưa có
        Long storageUnitId = request.getStorageUnitId();
        if (request.getContractId() != null && storageUnitId == null) {
            storageUnitId = rentalContractRepository.findById(request.getContractId())
                    .map(RentalContract::getStorageUnitId)
                    .orElse(null);
        }

        String desc = request.getDescription();
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            if (!desc.startsWith(request.getTitle())) {
                desc = "[" + request.getTitle() + "] " + desc;
            }
        }

        SupportRequest ticket = SupportRequest.builder()
                .code(code)
                .customerId(customerId)
                .contractId(request.getContractId())
                .storageUnitId(storageUnitId)
                .category(request.getCategory())
                .description(desc)
                .status(SupportStatus.NEW)
                .isUrgent(isUrgent)
                .slaDueAt(slaDueAt)
                .createdAt(now)
                .updatedAt(now)
                .build();

        SupportRequest saved = supportRequestRepository.save(ticket);

        // 4. Lưu ảnh đính kèm (nếu có)
        List<String> savedAttachmentUrls = new ArrayList<>();
        if (request.getAttachmentUrls() != null && !request.getAttachmentUrls().isEmpty()) {
            List<Attachment> attachments = request.getAttachmentUrls().stream()
                    .map(url -> Attachment.builder()
                            .entityType(ENTITY_TYPE_SUPPORT)
                            .entityId(saved.getId())
                            .fileUrl(url)
                            .uploadedBy(customerId)
                            .createdAt(now)
                            .build())
                    .collect(Collectors.toList());
            attachmentRepository.saveAll(attachments);
            savedAttachmentUrls.addAll(request.getAttachmentUrls());
        }

        return mapToDetailResponse(saved, savedAttachmentUrls);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SupportRequestSummaryResponse> getMySupportRequests(
            UserPrincipal currentUser, SupportStatus status, SupportCategory category, Pageable pageable
    ) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        Long customerId = currentUser.getId();
        Page<SupportRequest> page;

        if (status != null && category != null) {
            page = supportRequestRepository.findByCustomerIdAndStatusAndCategory(customerId, status, category, pageable);
        } else if (status != null) {
            page = supportRequestRepository.findByCustomerIdAndStatus(customerId, status, pageable);
        } else if (category != null) {
            page = supportRequestRepository.findByCustomerIdAndCategory(customerId, category, pageable);
        } else {
            page = supportRequestRepository.findByCustomerId(customerId, pageable);
        }

        List<SupportRequestSummaryResponse> content = page.getContent().stream()
                .map(this::mapToSummaryResponse)
                .collect(Collectors.toList());

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
    public SupportRequestDetailResponse getSupportRequestDetail(Long id, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        SupportRequest ticket = supportRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_FOUND));

        if (currentUser.getRole() == UserRole.STORAGE_CUSTOMER) {
            if (!ticket.getCustomerId().equals(currentUser.getId())) {
                throw new CustomException(ErrorCode.ACCESS_DENIED);
            }
        }

        List<Attachment> attachments = attachmentRepository.findByEntityTypeAndEntityId(ENTITY_TYPE_SUPPORT, id);
        List<String> urls = attachments.stream().map(Attachment::getFileUrl).collect(Collectors.toList());

        return mapToDetailResponse(ticket, urls);
    }

    @Override
    @Transactional
    public SupportRequestDetailResponse confirmResolution(Long id, ConfirmResolutionRequest request, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        SupportRequest ticket = supportRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_FOUND));

        if (!ticket.getCustomerId().equals(currentUser.getId())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        if (ticket.getStatus() != SupportStatus.RESOLVED) {
            throw new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_RESOLVED);
        }

        OffsetDateTime now = OffsetDateTime.now();

        if (Boolean.TRUE.equals(request.getSatisfied())) {
            ticket.setStatus(SupportStatus.CLOSED);
            ticket.setCustomerConfirmedAt(now);
        } else {
            // Khách chưa hài lòng: Đẩy lại trạng thái IN_PROGRESS kèm phản hồi
            ticket.setStatus(SupportStatus.IN_PROGRESS);
            String feedback = request.getEffectiveFeedback();
            if (feedback != null && !feedback.isBlank()) {
                String note = (ticket.getResolutionNote() != null ? ticket.getResolutionNote() + "\n" : "")
                        + "[Khách phản hồi]: " + feedback;
                ticket.setResolutionNote(note);
            }
        }

        SupportRequest saved = supportRequestRepository.save(ticket);

        List<Attachment> attachments = attachmentRepository.findByEntityTypeAndEntityId(ENTITY_TYPE_SUPPORT, id);
        List<String> urls = attachments.stream().map(Attachment::getFileUrl).collect(Collectors.toList());

        return mapToDetailResponse(saved, urls);
    }

    @Override
    @Transactional
    public void cancelSupportRequest(Long id, UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        SupportRequest ticket = supportRequestRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.SUPPORT_REQUEST_NOT_FOUND));

        if (!ticket.getCustomerId().equals(currentUser.getId())) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        if (ticket.getStatus() != SupportStatus.NEW) {
            throw new CustomException(ErrorCode.SUPPORT_REQUEST_CANNOT_BE_CANCELLED);
        }

        attachmentRepository.deleteByEntityTypeAndEntityId(ENTITY_TYPE_SUPPORT, id);
        supportRequestRepository.delete(ticket);
    }

    // --- Helper mapping methods ---

    private SupportRequestSummaryResponse mapToSummaryResponse(SupportRequest ticket) {
        SupportRequestSummaryResponse dto = new SupportRequestSummaryResponse();
        dto.setId(ticket.getId());
        dto.setCode(ticket.getCode());
        dto.setCustomerId(ticket.getCustomerId());
        dto.setContractId(ticket.getContractId());
        dto.setStorageUnitId(ticket.getStorageUnitId());
        dto.setCategory(ticket.getCategory());
        dto.setCategoryDisplayName(getCategoryDisplayName(ticket.getCategory()));
        dto.setDescription(ticket.getDescription());
        dto.setStatus(ticket.getStatus());
        dto.setStatusDisplayName(getStatusDisplayName(ticket.getStatus()));
        dto.setIsUrgent(ticket.isUrgent());
        dto.setAssignedStaffId(ticket.getAssignedStaffId());
        dto.setSlaDueAt(ticket.getSlaDueAt());
        dto.setResolvedAt(ticket.getResolvedAt());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        dto.setRelocationRequired(Boolean.TRUE.equals(ticket.getRelocationRequired()));
        dto.setCustomerNotice(ticket.getCustomerNotice());

        enrichRelationInfo(dto, ticket);
        return dto;
    }

    private SupportRequestDetailResponse mapToDetailResponse(SupportRequest ticket, List<String> attachmentUrls) {
        SupportRequestDetailResponse detail = new SupportRequestDetailResponse();
        detail.setId(ticket.getId());
        detail.setCode(ticket.getCode());
        detail.setCustomerId(ticket.getCustomerId());
        detail.setContractId(ticket.getContractId());
        detail.setStorageUnitId(ticket.getStorageUnitId());
        detail.setCategory(ticket.getCategory());
        detail.setCategoryDisplayName(getCategoryDisplayName(ticket.getCategory()));
        detail.setDescription(ticket.getDescription());
        detail.setStatus(ticket.getStatus());
        detail.setStatusDisplayName(getStatusDisplayName(ticket.getStatus()));
        detail.setIsUrgent(ticket.isUrgent());
        detail.setAssignedStaffId(ticket.getAssignedStaffId());
        detail.setSlaDueAt(ticket.getSlaDueAt());
        detail.setResolvedAt(ticket.getResolvedAt());
        detail.setResolutionNote(ticket.getResolutionNote());
        detail.setCustomerConfirmedAt(ticket.getCustomerConfirmedAt());
        detail.setAutoClosedAt(ticket.getAutoClosedAt());
        detail.setCreatedAt(ticket.getCreatedAt());
        detail.setUpdatedAt(ticket.getUpdatedAt());
        detail.setAttachmentUrls(attachmentUrls != null ? attachmentUrls : Collections.emptyList());

        detail.setCanCancel(ticket.getStatus() == SupportStatus.NEW);
        detail.setCanConfirm(ticket.getStatus() == SupportStatus.RESOLVED);
        detail.setRelocationRequired(Boolean.TRUE.equals(ticket.getRelocationRequired()));
        detail.setCustomerNotice(ticket.getCustomerNotice());

        enrichRelationInfo(detail, ticket);
        return detail;
    }

    private void enrichRelationInfo(SupportRequestSummaryResponse dto, SupportRequest ticket) {
        if (ticket.getContractId() != null) {
            rentalContractRepository.findById(ticket.getContractId()).ifPresent(c -> {
                dto.setContractCode(c.getCode());
                if (c.getFacilityId() != null) {
                    facilityRepository.findById(c.getFacilityId()).ifPresent(f -> dto.setFacilityName(f.getName()));
                }
            });
        }
        if (ticket.getStorageUnitId() != null) {
            storageUnitRepository.findById(ticket.getStorageUnitId()).ifPresent(u -> dto.setStorageUnitCode(u.getCode()));
        }
        if (ticket.getAssignedStaffId() != null) {
            userRepository.findById(ticket.getAssignedStaffId()).ifPresent(u -> dto.setAssignedStaffName(u.getFullName()));
        }
    }

    private void enrichRelationInfo(SupportRequestDetailResponse dto, SupportRequest ticket) {
        if (ticket.getContractId() != null) {
            rentalContractRepository.findById(ticket.getContractId()).ifPresent(c -> {
                dto.setContractCode(c.getCode());
                if (c.getFacilityId() != null) {
                    facilityRepository.findById(c.getFacilityId()).ifPresent(f -> dto.setFacilityName(f.getName()));
                }
            });
        }
        if (ticket.getStorageUnitId() != null) {
            storageUnitRepository.findById(ticket.getStorageUnitId()).ifPresent(u -> dto.setStorageUnitCode(u.getCode()));
        }
        if (ticket.getAssignedStaffId() != null) {
            userRepository.findById(ticket.getAssignedStaffId()).ifPresent(u -> dto.setAssignedStaffName(u.getFullName()));
        }
    }

    private String getCategoryDisplayName(SupportCategory category) {
        if (category == null) return "";
        return switch (category) {
            case UNIT_DAMAGE -> "Hư hại ô kho";
            case LOCK_ACCESS -> "Sự cố khóa / Mã PIN ra vào";
            case PAYMENT -> "Vấn đề thanh toán / Tiền cọc";
            case BELONGINGS -> "Tài sản lưu trữ";
            case OTHER -> "Sự cố khác";
        };
    }

    private String getStatusDisplayName(SupportStatus status) {
        if (status == null) return "";
        return switch (status) {
            case NEW -> "Mới tiếp nhận";
            case ASSIGNED -> "Đã phân công";
            case IN_PROGRESS -> "Đang xử lý";
            case RESOLVED -> "Đã xử lý (Chờ nghiệm thu)";
            case CLOSED -> "Đã đóng";
            case AUTO_CLOSED -> "Tự động đóng";
        };
    }
}
