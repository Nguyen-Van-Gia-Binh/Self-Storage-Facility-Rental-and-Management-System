package com.swp391.selfstorage.support.scheduler;

import com.swp391.selfstorage.policy.entity.PolicyVersion;
import com.swp391.selfstorage.policy.repository.PolicyVersionRepository;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.repository.SupportRequestRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupportAutoCloseJobTest {

    @Mock
    private SupportRequestRepository supportRequestRepository;

    @Mock
    private PolicyVersionRepository policyVersionRepository;

    @InjectMocks
    private SupportAutoCloseJob supportAutoCloseJob;

    @Test
    @DisplayName("closeResolvedTickets gọi bulkAutoCloseResolvedTickets một lần duy nhất với số ngày làm việc từ Policy")
    void testCloseResolvedTicketsWithPolicy() {
        PolicyVersion mockPolicy = new PolicyVersion();
        mockPolicy.setSupportAutoCloseWorkingDays(5);

        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any()))
                .thenReturn(Optional.of(mockPolicy));
        when(supportRequestRepository.bulkAutoCloseResolvedTickets(
                eq(SupportStatus.CLOSED),
                eq(SupportStatus.RESOLVED),
                any(OffsetDateTime.class),
                any(OffsetDateTime.class)
        )).thenReturn(3);

        supportAutoCloseJob.closeResolvedTickets();

        verify(supportRequestRepository, times(1)).bulkAutoCloseResolvedTickets(
                eq(SupportStatus.CLOSED),
                eq(SupportStatus.RESOLVED),
                any(OffsetDateTime.class),
                any(OffsetDateTime.class)
        );
    }

    @Test
    @DisplayName("closeResolvedTickets dùng giá trị mặc định 7 ngày khi Policy không thiết lập")
    void testCloseResolvedTicketsFallbackDays() {
        when(policyVersionRepository.findTopByEffectiveFromLessThanEqualOrderByEffectiveFromDescVersionNoDesc(any()))
                .thenReturn(Optional.empty());
        when(supportRequestRepository.bulkAutoCloseResolvedTickets(
                eq(SupportStatus.CLOSED),
                eq(SupportStatus.RESOLVED),
                any(OffsetDateTime.class),
                any(OffsetDateTime.class)
        )).thenReturn(0);

        supportAutoCloseJob.closeResolvedTickets();

        verify(supportRequestRepository, times(1)).bulkAutoCloseResolvedTickets(
                eq(SupportStatus.CLOSED),
                eq(SupportStatus.RESOLVED),
                any(OffsetDateTime.class),
                any(OffsetDateTime.class)
        );
    }
}

