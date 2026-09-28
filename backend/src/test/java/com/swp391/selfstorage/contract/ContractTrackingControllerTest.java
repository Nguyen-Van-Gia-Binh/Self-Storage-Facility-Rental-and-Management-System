package com.swp391.selfstorage.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.auth.service.FacilitySecurityService;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.contract.controller.ContractController;
import com.swp391.selfstorage.contract.dto.ContractFilterRequest;
import com.swp391.selfstorage.contract.dto.ContractFinancialSummaryResponse;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.service.ContractService;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @MockBean(name = "facilitySecurity")
    private FacilitySecurityService facilitySecurityService;

    private UserPrincipal managerPrincipal;

    @BeforeEach
    void setUp() {
        managerPrincipal = new UserPrincipal(99L, "manager@test.com", "hash", "Lê Văn Manager",
                UserRole.FACILITY_MANAGER, UserStatus.ACTIVE, List.of(1L), Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(managerPrincipal, null, managerPrincipal.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

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
        when(contractService.getContractsPage(any(ContractFilterRequest.class), any(Pageable.class), any()))
                .thenReturn(pageResponse);

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
                .contractCode("CTR-100")
                .customerName("Lê Văn A")
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
                .andExpect(jsonPath("$.data.contractCode").value("CTR-100"))
                .andExpect(jsonPath("$.data.customerName").value("Lê Văn A"))
                .andExpect(jsonPath("$.data.totalOutstandingDebt").value(250_000));
    }

    @Test
    @DisplayName("POST /contracts/{id}/reassign-unit trả về 200 OK khi đổi ô kho với managerId từ UserPrincipal")
    void testReassignUnit() throws Exception {
        com.swp391.selfstorage.contract.dto.ReassignUnitRequest req =
                com.swp391.selfstorage.contract.dto.ReassignUnitRequest.builder()
                        .newStorageUnitId(43L)
                        .reason("Bảo trì khóa")
                        .build();

        ContractSummaryResponse summary = ContractSummaryResponse.builder()
                .id(100L)
                .code("CTR-100")
                .storageUnitId(43L)
                .storageUnitCode("U-43")
                .status(ContractStatus.ACTIVE)
                .build();

        when(contractService.reassignUnit(eq(100L), any(), eq(99L), any())).thenReturn(summary);

        // Không gửi header X-Manager-Id
        mockMvc.perform(post("/contracts/100/reassign-unit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.storageUnitId").value(43))
                .andExpect(jsonPath("$.data.storageUnitCode").value("U-43"));
    }

    @Test
    @DisplayName("POST /contracts/{id}/reassign-unit trả về 401 khi chưa đăng nhập")
    void testReassignUnit_Unauthorized() throws Exception {
        SecurityContextHolder.clearContext();

        com.swp391.selfstorage.contract.dto.ReassignUnitRequest req =
                com.swp391.selfstorage.contract.dto.ReassignUnitRequest.builder()
                        .newStorageUnitId(43L)
                        .reason("Bảo trì khóa")
                        .build();

        mockMvc.perform(post("/contracts/100/reassign-unit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }
}
