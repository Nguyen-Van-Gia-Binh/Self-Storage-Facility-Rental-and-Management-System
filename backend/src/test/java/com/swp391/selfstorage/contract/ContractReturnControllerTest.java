package com.swp391.selfstorage.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.auth.service.FacilitySecurityService;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.contract.controller.ContractController;
import com.swp391.selfstorage.contract.dto.*;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.contract.entity.ReturnRequestStatus;
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
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

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

    @MockBean(name = "facilitySecurity")
    private FacilitySecurityService facilitySecurityService;

    private UserPrincipal staffPrincipal;

    @BeforeEach
    void setUp() {
        staffPrincipal = new UserPrincipal(99L, "staff@test.com", "hash", "Trần Văn Staff",
                UserRole.FACILITY_STAFF, UserStatus.ACTIVE, List.of(1L), Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(staffPrincipal, null, staffPrincipal.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

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

        when(contractService.submitReturnNotice(eq(500L), any(ReturnNoticeRequest.class), any()))
                .thenReturn(res);

        mockMvc.perform(post("/contracts/500/return-notices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.contractId").value(500));
    }

    @Test
    @DisplayName("POST /contracts/{id}/return-inspections trả về 200 OK với danh tính lấy từ UserPrincipal")
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

        when(contractService.submitReturnInspection(eq(500L), any(ReturnInspectionRequest.class), eq(99L), any()))
                .thenReturn(res);

        // Không gửi header X-Staff-Id mà lấy trực tiếp từ UserPrincipal(id=99L)
        mockMvc.perform(post("/contracts/500/return-inspections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(500))
                .andExpect(jsonPath("$.data.status").value("PENDING_RETURN"))
                .andExpect(jsonPath("$.data.estimatedDepositRefund").value(1_000_000));
    }

    @Test
    @DisplayName("POST /contracts/{id}/return-inspections trả về 401 khi chưa đăng nhập (currentUser = null)")
    void testSubmitReturnInspection_Unauthorized() throws Exception {
        SecurityContextHolder.clearContext();

        ReturnInspectionRequest req = ReturnInspectionRequest.builder()
                .returnDate(LocalDate.now())
                .condition("GOOD")
                .damageCost(0L)
                .build();

        mockMvc.perform(post("/contracts/500/return-inspections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /contracts/{id}/cancel-return thành công trả về 200 OK")
    void testCancelReturnNotice_Success() throws Exception {
        ReturnNoticeResponse res = ReturnNoticeResponse.builder()
                .id(10L)
                .contractId(500L)
                .intendedReturnDate(LocalDate.now().plusDays(2))
                .status(ReturnRequestStatus.CANCELLED)
                .createdAt(OffsetDateTime.now())
                .build();

        when(contractService.cancelReturnNotice(eq(500L), any(UserPrincipal.class)))
                .thenReturn(res);

        mockMvc.perform(post("/contracts/500/cancel-return"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.contractId").value(500))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }
}
