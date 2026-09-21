package com.swp391.selfstorage.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.contract.controller.ContractController;
import com.swp391.selfstorage.contract.dto.SettlementApprovalRequest;
import com.swp391.selfstorage.contract.dto.SettlementApprovalResponse;
import com.swp391.selfstorage.contract.dto.SettlementPreviewResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.service.ContractService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContractController.class)
@AutoConfigureMockMvc(addFilters = false)
class ContractSettlementControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private ContractService contractService;

        @Test
        @DisplayName("GET /contracts/{id}/settlement-preview trả về 200 OK")
        void testGetSettlementPreview() throws Exception {
                SettlementPreviewResponse preview = SettlementPreviewResponse.builder()
                                .contractId(500L)
                                .depositAmount(1_000_000L)
                                .damageCost(150_000L)
                                .overdueFee(100_000L)
                                .unpaidExtraCharges(0L)
                                .depositRefundAmount(750_000L)
                                .payableAmount(0L)
                                .build();

                when(contractService.getSettlementPreview(eq(500L), any())).thenReturn(preview);

                mockMvc.perform(get("/contracts/500/settlement-preview")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value(200))
                                .andExpect(jsonPath("$.data.contractId").value(500))
                                .andExpect(jsonPath("$.data.depositRefundAmount").value(750_000))
                                .andExpect(jsonPath("$.data.payableAmount").value(0));
        }

        @Test
        @DisplayName("POST /contracts/{id}/settlement-approval trả về 200 OK kèm CLOSED")
        void testApproveSettlement() throws Exception {
                SettlementApprovalRequest request = SettlementApprovalRequest.builder()
                                .adjustedDamageCost(150_000L)
                                .approvedNotes("FM đồng ý thanh lý")
                                .build();

                SettlementApprovalResponse response = SettlementApprovalResponse.builder()
                                .contractId(500L)
                                .status(ContractStatus.CLOSED)
                                .depositRefundAmount(750_000L)
                                .payableAmount(0L)
                                .settledAt(OffsetDateTime.now())
                                .message("Phê duyệt quyết toán và hoàn cọc thành công")
                                .build();

                when(contractService.approveSettlement(eq(500L), any(), any(), any())).thenReturn(response);

                mockMvc.perform(post("/contracts/500/settlement-approval")
                                .header("X-Manager-Id", "99")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status").value(200))
                                .andExpect(jsonPath("$.data.contractId").value(500))
                                .andExpect(jsonPath("$.data.status").value("CLOSED"))
                                .andExpect(jsonPath("$.data.depositRefundAmount").value(750_000));
        }
}
