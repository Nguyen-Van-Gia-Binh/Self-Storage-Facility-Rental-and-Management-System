package com.swp391.selfstorage.policy.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.policy.dto.CreatePolicyRequest;
import com.swp391.selfstorage.policy.dto.PolicyResponse;
import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.mapper.PolicyMapper;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.policy.service.impl.PolicyServiceImpl;

@ExtendWith(MockitoExtension.class)
class PolicyServiceTest {

    @Mock
    private PolicyVersionRepository policyVersionRepository;

    private final PolicyMapper policyMapper = new PolicyMapper();

    private PolicyService policyService;

    @BeforeEach
    void setUp() {
        policyService = new PolicyServiceImpl(policyVersionRepository, policyMapper);
    }

    private PolicyVersion buildMockEntity(Long id, Integer versionNo) {
        return PolicyVersion.builder()
                .id(id)
                .versionNo(versionNo)
                .effectiveFrom(OffsetDateTime.now().minusDays(1))
                .depositMultiplier(BigDecimal.valueOf(1.0))
                .reservationHoldHours(48)
                .checkinGraceDays(3)
                .cancelFullRefundHours(24)
                .cancelLateRefundRate(BigDecimal.valueOf(0.50))
                .cancelNoShowRefundRate(BigDecimal.valueOf(0.00))
                .renewalReminderDays("30,15,7,3,1")
                .renewalMinMonths(1)
                .renewalMaxMonths(12)
                .overdueGraceDays(3)
                .overdueDailyRate(BigDecimal.valueOf(0.10))
                .overdueCapRate(BigDecimal.valueOf(1.00))
                .overdueLockAccessDays(7)
                .overdueNoticeDays(15)
                .overdueTerminationDays(30)
                .returnNoticeDays(7)
                .returnRefundWorkingDays(5)
                .returnEarlyRefundRate(BigDecimal.valueOf(0.80))
                .accessPinLength(6)
                .supportUrgentSlaHours(4)
                .supportAutoCloseWorkingDays(3)
                .publishedBy(100L)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private CreatePolicyRequest buildMockRequest(Integer versionNo) {
        return CreatePolicyRequest.builder()
                .versionNo(versionNo)
                .effectiveFrom(OffsetDateTime.now().plusDays(1))
                .depositMultiplier(BigDecimal.valueOf(1.5))
                .reservationHoldHours(48)
                .checkinGraceDays(3)
                .cancelFullRefundHours(24)
                .cancelLateRefundRate(BigDecimal.valueOf(0.50))
                .cancelNoShowRefundRate(BigDecimal.valueOf(0.00))
                .renewalReminderDays("30,15,7,3,1")
                .renewalMinMonths(1)
                .renewalMaxMonths(12)
                .overdueGraceDays(3)
                .overdueDailyRate(BigDecimal.valueOf(0.10))
                .overdueCapRate(BigDecimal.valueOf(1.00))
                .overdueNoticeDays(4)
                .overdueLockAccessDays(7)
                .overdueTerminationDays(10)
                .returnNoticeDays(7)
                .returnRefundWorkingDays(5)
                .returnEarlyRefundRate(BigDecimal.valueOf(0.80))
                .accessPinLength(6)
                .supportUrgentSlaHours(4)
                .supportAutoCloseWorkingDays(3)
                .build();
    }

    @Test
    @DisplayName("Lấy chính sách hiệu lực thành công khi có phiên bản phù hợp")
    void testGetActivePolicy_success() {
        PolicyVersion entity = buildMockEntity(1L, 1);
        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any(OffsetDateTime.class)))
                .thenReturn(Optional.of(entity));

        PolicyResponse response = policyService.getActivePolicy();

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(1, response.getVersionNo());
        assertEquals(100L, response.getPublishedBy());
    }

    @Test
    @DisplayName("Ném POLICY_NOT_FOUND (404) khi chưa có chính sách nào có hiệu lực")
    void testGetActivePolicy_notFound() {
        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any(OffsetDateTime.class)))
                .thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> policyService.getActivePolicy());

        assertEquals(ErrorCode.POLICY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tạo chính sách mới thành công khi chỉ định version_no chưa tồn tại")
    void testCreatePolicy_withExplicitVersion_success() {
        CreatePolicyRequest request = buildMockRequest(5);
        when(policyVersionRepository.existsByVersionNo(5)).thenReturn(false);
        when(policyVersionRepository.save(any(PolicyVersion.class))).thenAnswer(inv -> {
            PolicyVersion entity = inv.getArgument(0);
            entity.setId(10L);
            return entity;
        });

        request.setOverdueNoticeDays(99);
        PolicyResponse response = policyService.createPolicy(request, 200L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals(5, response.getVersionNo());
        assertEquals(200L, response.getPublishedBy());
        assertEquals(4, response.getOverdueNoticeDays());
        verify(policyVersionRepository).save(any(PolicyVersion.class));
    }

    @Test
    @DisplayName("Ném POLICY_VERSION_ALREADY_EXISTS (409) khi chỉ định version_no đã tồn tại")
    void testCreatePolicy_withDuplicateVersion_throwsConflict() {
        CreatePolicyRequest request = buildMockRequest(5);
        when(policyVersionRepository.existsByVersionNo(5)).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class, () -> policyService.createPolicy(request, 200L));

        assertEquals(ErrorCode.POLICY_VERSION_ALREADY_EXISTS, ex.getErrorCode());
        verify(policyVersionRepository, never()).save(any(PolicyVersion.class));
    }

    @Test
    @DisplayName("Tự động tăng version_no (max + 1) khi version_no để trống và DB đã có version")
    void testCreatePolicy_autoIncrementVersion_success() {
        CreatePolicyRequest request = buildMockRequest(null);
        PolicyVersion latest = buildMockEntity(2L, 3);

        when(policyVersionRepository.findTopByOrderByVersionNoDesc()).thenReturn(Optional.of(latest));
        when(policyVersionRepository.save(any(PolicyVersion.class))).thenAnswer(inv -> {
            PolicyVersion entity = inv.getArgument(0);
            entity.setId(11L);
            return entity;
        });

        PolicyResponse response = policyService.createPolicy(request, 200L);

        assertNotNull(response);
        assertEquals(4, response.getVersionNo()); // 3 + 1 = 4
        verify(policyVersionRepository).save(any(PolicyVersion.class));
    }

    @Test
    @DisplayName("Tự động gán version_no = 1 khi version_no để trống và DB chưa có phiên bản nào")
    void testCreatePolicy_autoIncrementFirstVersion_success() {
        CreatePolicyRequest request = buildMockRequest(null);

        when(policyVersionRepository.findTopByOrderByVersionNoDesc()).thenReturn(Optional.empty());
        when(policyVersionRepository.save(any(PolicyVersion.class))).thenAnswer(inv -> {
            PolicyVersion entity = inv.getArgument(0);
            entity.setId(1L);
            return entity;
        });

        PolicyResponse response = policyService.createPolicy(request, 200L);

        assertNotNull(response);
        assertEquals(1, response.getVersionNo()); // Khởi tạo từ 1
        verify(policyVersionRepository).save(any(PolicyVersion.class));
    }

    @Test
    @DisplayName("Lấy chi tiết chính sách theo ID thành công")
    void testGetPolicyById_success() {
        PolicyVersion entity = buildMockEntity(1L, 1);
        when(policyVersionRepository.findById(1L)).thenReturn(Optional.of(entity));

        PolicyResponse response = policyService.getPolicyById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    @DisplayName("Ném POLICY_NOT_FOUND (404) khi tìm ID không tồn tại")
    void testGetPolicyById_notFound() {
        when(policyVersionRepository.findById(999L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> policyService.getPolicyById(999L));

        assertEquals(ErrorCode.POLICY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Phân trang danh sách chính sách thành công")
    void testGetPolicies_pagination_success() {
        PolicyVersion entity = buildMockEntity(1L, 1);
        Page<PolicyVersion> page = new PageImpl<>(List.of(entity));
        when(policyVersionRepository.findAll(any(Pageable.class))).thenReturn(page);

        PageResponse<PolicyResponse> response = policyService.getPolicies(PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals(1, response.getTotalElements());
    }

    @Test
    @DisplayName("BR-GEN-01: từ chối ngày hiệu lực trong quá khứ")
    void testCreatePolicy_rejectsPastEffectiveDate() {
        CreatePolicyRequest request = buildMockRequest(6);
        request.setEffectiveFrom(OffsetDateTime.now().minusDays(1));

        CustomException ex = assertThrows(CustomException.class, () -> policyService.createPolicy(request, 200L));

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
        verify(policyVersionRepository, never()).save(any(PolicyVersion.class));
    }

    @Test
    @DisplayName("US-BM-02.1: từ chối hệ số cọc bằng 0")
    void testCreatePolicy_rejectsZeroDepositMultiplier() {
        CreatePolicyRequest request = buildMockRequest(6);
        request.setDepositMultiplier(BigDecimal.ZERO);

        CustomException ex = assertThrows(CustomException.class, () -> policyService.createPolicy(request, 200L));

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("US-BM-02.2: từ chối tháng gia hạn tối thiểu lớn hơn tối đa và mốc nhắc trùng")
    void testCreatePolicy_rejectsInvalidRenewalMilestones() {
        CreatePolicyRequest minOverMax = buildMockRequest(6);
        minOverMax.setRenewalMinMonths(12);
        minOverMax.setRenewalMaxMonths(1);
        assertThrows(CustomException.class, () -> policyService.createPolicy(minOverMax, 200L));

        CreatePolicyRequest duplicate = buildMockRequest(6);
        duplicate.setRenewalReminderDays("7,3,7");
        assertThrows(CustomException.class, () -> policyService.createPolicy(duplicate, 200L));
        verify(policyVersionRepository, never()).save(any(PolicyVersion.class));
    }

    @Test
    @DisplayName("US-BM-02.5: từ chối mốc quá hạn lệch thứ tự")
    void testCreatePolicy_rejectsOverdueOrder() {
        CreatePolicyRequest request = buildMockRequest(6);
        request.setOverdueGraceDays(10);
        request.setOverdueNoticeDays(4);
        request.setOverdueLockAccessDays(7);
        request.setOverdueTerminationDays(10);

        CustomException ex = assertThrows(CustomException.class, () -> policyService.createPolicy(request, 200L));

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }
}
