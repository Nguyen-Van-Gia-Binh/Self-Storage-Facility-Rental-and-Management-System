package com.swp391.selfstorage.policy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.policy.dto.OverdueProcessingResult;
import com.swp391.selfstorage.policy.service.OverdueProcessingService;
import com.swp391.selfstorage.policy.service.PolicyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PolicyController.class)
@AutoConfigureMockMvc(addFilters = false)
class PolicyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PolicyService policyService;

    @MockBean
    private OverdueProcessingService overdueProcessingService;

    @Test
    @DisplayName("POST /policies/cron/process-overdue - Kích hoạt thủ công cronjob trả về 200 OK")
    void testTriggerOverdueProcessing_Success() throws Exception {
        OverdueProcessingResult mockResult = OverdueProcessingResult.builder()
                .totalScanned(5)
                .markedOverdueCount(2)
                .penalizedCount(2)
                .terminatedCount(1)
                .totalPenaltiesAccrued(1_400_000L)
                .executedAt(OffsetDateTime.now())
                .build();

        when(overdueProcessingService.processOverdueContracts(any(LocalDate.class)))
                .thenReturn(mockResult);

        mockMvc.perform(post("/policies/cron/process-overdue")
                .param("date", "2026-10-15")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.totalScanned").value(5))
                .andExpect(jsonPath("$.data.markedOverdueCount").value(2))
                .andExpect(jsonPath("$.data.terminatedCount").value(1))
                .andExpect(jsonPath("$.data.totalPenaltiesAccrued").value(1_400_000L));
    }
}
