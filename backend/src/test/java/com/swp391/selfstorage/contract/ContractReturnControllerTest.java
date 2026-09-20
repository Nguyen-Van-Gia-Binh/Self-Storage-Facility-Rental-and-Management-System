package com.swp391.selfstorage.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.ReturnRequestStatus;
import com.swp391.selfstorage.contract.service.ContractService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContractController.class)
@AutoConfigureMockMvc(addFilters = false)
class ContractReturnControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ContractService contractService;

    @Test
    @DisplayName("POST /contracts/{id}/return-notices trả về 201 Created")
    void testSubmitReturnNotice() throws Exception {
        ReturnNoticeRequest req = ReturnNoticeRequest.builder()
                .intendedReturnDate(LocalDate.now().plusDays(3))
                .notes("Báo trả kho đúng hạn")
                .build();

        ReturnNoticeResponse res = ReturnNoticeResponse.builder()
                .id(10L)
                .contractId(500L)
                .intendedReturnDate(req.getIntendedReturnDate())
                .status(ReturnRequestStatus.PENDING)
                .createdAt(OffsetDateTime.now())
                .build();

        when(contractService.submitReturnNotice(eq(500L), any(ReturnNoticeRequest.class), any())).thenReturn(res);

        mockMvc.perform(post("/contracts/500/return-notices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.contractId").value(500));
    }

    @Test
    @DisplayName("POST /contracts/{id}/return-inspections trả về 200 OK")
    void testSubmitReturnInspection() throws Exception {
        ReturnInspectionRequest req = ReturnInspectionRequest.builder()
                .returnDate(LocalDate.now())
                .condition("GOOD")
                .damageCost(0L)
                .build();

        ReturnInspectionResponse res = ReturnInspectionResponse.builder()
                .id(500L)
                .status(ContractStatus.PENDING_RETURN)
                .returnDate(req.getReturnDate())
                .estimatedDepositRefund(1_000_000L)
                .damageCost(0L)
                .build();

        when(contractService.submitReturnInspection(eq(500L), any(ReturnInspectionRequest.class), any(), any())).thenReturn(res);

        mockMvc.perform(post("/contracts/500/return-inspections")
                        .header("X-Staff-Id", "99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(500))
                .andExpect(jsonPath("$.data.status").value("PENDING_RETURN"))
                .andExpect(jsonPath("$.data.estimatedDepositRefund").value(1_000_000));
    }
}
