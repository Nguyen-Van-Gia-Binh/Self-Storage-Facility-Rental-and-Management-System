package com.swp391.selfstorage.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.contract.controller.ContractRenewalController;
import com.swp391.selfstorage.contract.dto.RenewalQuoteResponse;
import com.swp391.selfstorage.contract.dto.RenewalRequest;
import com.swp391.selfstorage.contract.dto.RenewalResponse;
import com.swp391.selfstorage.contract.service.RenewalService;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContractRenewalController.class)
@AutoConfigureMockMvc(addFilters = false)
class ContractRenewalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RenewalService renewalService;

    @Test
    @DisplayName("POST /contracts/{id}/renewals/quote - Xem trước báo giá gia hạn thành công (200 OK)")
    void testRenewalQuote_Success() throws Exception {
        RenewalRequest request = RenewalRequest.builder()
                .renewalMonths(6)
                .build();

        RenewalQuoteResponse quoteResponse = RenewalQuoteResponse.builder()
                .contractId(1L)
                .contractCode("CTR-202610-001")
                .renewalMonths(6)
                .previousEndDate(LocalDate.of(2026, 12, 31))
                .newEndDate(LocalDate.of(2027, 6, 30))
                .monthlyPriceSnapshot(2_000_000L)
                .rentalFeeAmount(12_000_000L)
                .overdueFeeSettled(0L)
                .totalAmount(12_000_000L)
                .policyVersionId(1L)
                .build();

        when(renewalService.getRenewalQuote(eq(1L), any(RenewalRequest.class)))
                .thenReturn(quoteResponse);

        mockMvc.perform(post("/contracts/1/renewals/quote")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.contractCode").value("CTR-202610-001"))
                .andExpect(jsonPath("$.data.renewalMonths").value(6))
                .andExpect(jsonPath("$.data.totalAmount").value(12_000_000L));
    }

    @Test
    @DisplayName("POST /contracts/{id}/renewals - Kích hoạt gia hạn hợp đồng thành công (201 CREATED)")
    void testProcessRenewal_Success() throws Exception {
        RenewalRequest request = RenewalRequest.builder()
                .renewalMonths(6)
                .build();

        RenewalResponse response = RenewalResponse.builder()
                .id(10L)
                .contractId(1L)
                .previousEndDate(LocalDate.of(2026, 12, 31))
                .newEndDate(LocalDate.of(2027, 6, 30))
                .renewalMonths(6)
                .monthlyPriceSnapshot(2_000_000L)
                .policyVersionId(1L)
                .overdueFeeSettled(0L)
                .rentalFeeAmount(12_000_000L)
                .totalPaid(12_000_000L)
                .createdAt(OffsetDateTime.now())
                .build();

        when(renewalService.processRenewal(eq(1L), any(RenewalRequest.class), eq(99L)))
                .thenReturn(response);

        mockMvc.perform(post("/contracts/1/renewals")
                .param("paymentId", "99")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(10L))
                .andExpect(jsonPath("$.data.renewalMonths").value(6))
                .andExpect(jsonPath("$.data.newEndDate").value("2027-06-30"));
    }

    @Test
    @DisplayName("POST /contracts/{id}/renewals - Báo lỗi 400 Bad Request khi số tháng gia hạn < 1")
    void testProcessRenewal_Validation_InvalidMonths() throws Exception {
        RenewalRequest invalidRequest = RenewalRequest.builder()
                .renewalMonths(0) // Vi phạm @Min(1)
                .build();

        mockMvc.perform(post("/contracts/1/renewals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /contracts/{id}/renewals - Lấy lịch sử gia hạn thành công (200 OK)")
    void testGetRenewalHistory_Success() throws Exception {
        RenewalResponse item = RenewalResponse.builder()
                .id(10L)
                .contractId(1L)
                .renewalMonths(3)
                .totalPaid(6_000_000L)
                .build();

        when(renewalService.getRenewalHistory(1L))
                .thenReturn(List.of(item));

        mockMvc.perform(get("/contracts/1/renewals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].id").value(10L))
                .andExpect(jsonPath("$.data[0].renewalMonths").value(3));
    }
}
