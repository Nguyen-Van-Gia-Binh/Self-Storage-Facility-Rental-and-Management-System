package com.swp391.selfstorage.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.contract.dto.ContractFilterRequest;
import com.swp391.selfstorage.contract.dto.ContractFinancialSummaryResponse;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.service.ContractService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContractController.class)
@AutoConfigureMockMvc(addFilters = false)
class ContractTrackingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ContractService contractService;

    @Test
    @DisplayName("GET /contracts trả về 200 OK kèm danh sách phân trang")
    void testGetContracts() throws Exception {
        ContractSummaryResponse summary = ContractSummaryResponse.builder()
                .id(100L)
                .code("CTR-202610-001")
                .customerId(15L)
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .nearExpiration(true)
                .build();

        PageResponse<ContractSummaryResponse> pageResponse = new PageResponse<>(List.of(summary), 0, 10, 1, 1);
        when(contractService.getContractsPage(any(ContractFilterRequest.class), any(Pageable.class), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/contracts")
                        .param("page", "0")
                        .param("size", "10")
                        .param("status", "ACTIVE")
                        .param("expiringSoon", "true")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content[0].id").value(100))
                .andExpect(jsonPath("$.data.content[0].code").value("CTR-202610-001"))
                .andExpect(jsonPath("$.data.content[0].nearExpiration").value(true));
    }

    @Test
    @DisplayName("GET /contracts/{id}/financial-summary trả về 200 OK kèm công nợ")
    void testGetFinancialSummary() throws Exception {
        ContractFinancialSummaryResponse summary = ContractFinancialSummaryResponse.builder()
                .contractId(100L)
                .depositAmount(1_000_000L)
                .depositBalance(1_000_000L)
                .totalRentalFee(3_000_000L)
                .overdueFeeAccrued(200_000L)
                .totalUnpaidExtraCharges(50_000L)
                .totalOutstandingDebt(250_000L)
                .build();

        when(contractService.getContractFinancialSummary(eq(100L), any())).thenReturn(summary);

        mockMvc.perform(get("/contracts/100/financial-summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.contractId").value(100))
                .andExpect(jsonPath("$.data.totalOutstandingDebt").value(250_000));
    }
}
