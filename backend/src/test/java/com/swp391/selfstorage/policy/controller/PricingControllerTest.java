package com.swp391.selfstorage.policy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.exception.CustomException;
import com.swp391.selfstorage.common.exception.ErrorCode;
import com.swp391.selfstorage.policy.dto.FacilityPriceResponse;
import com.swp391.selfstorage.policy.dto.UpdatePriceRequest;
import com.swp391.selfstorage.policy.service.PricingService;
import com.swp391.selfstorage.unit.entity.FacilityUnitTypePrice;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PricingController.class)
@AutoConfigureMockMvc(addFilters = false)
@EnableMethodSecurity
class PricingControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean private PricingService pricingService;

    @Test
    @WithMockUser(roles = "FACILITY_MANAGER")
    @DisplayName("SEC-01: Facility Manager (FM) gọi PUT /facilities/1/prices/7 bị chặn 403 Forbidden")
    void shouldReturn403_whenFacilityManagerAttemptsToUpdatePrice() throws Exception {
        UpdatePriceRequest req = new UpdatePriceRequest(5_000_000L);

        mockMvc.perform(put("/facilities/1/prices/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    @WithMockUser(roles = "BUSINESS_OPERATIONS_MANAGER")
    @DisplayName("SEC-03: BOM gọi PUT /facilities/1/prices/7 thành công trả về 200 OK")
    void shouldReturn200_whenBomUpdatesPrice() throws Exception {
        UpdatePriceRequest req = new UpdatePriceRequest(5_000_000L);
        FacilityPriceResponse res = FacilityPriceResponse.builder()
                .id(10L)
                .facilityId(1L)
                .unitTypeId(7L)
                .monthlyPrice(5_000_000L)
                .build();

        when(pricingService.updatePrice(eq(1L), eq(7L), any(UpdatePriceRequest.class))).thenReturn(res);

        mockMvc.perform(put("/facilities/1/prices/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlyPrice").value(5_000_000L));
    }

    @Test
    @WithMockUser(roles = "BUSINESS_OPERATIONS_MANAGER")
    @DisplayName("CON-01: Xung đột Optimistic Locking trả về 409 Conflict kèm mã OPTIMISTIC_LOCK_CONFLICT")
    void shouldReturn409Conflict_whenOptimisticLockingFails() throws Exception {
        UpdatePriceRequest req = UpdatePriceRequest.builder().monthlyPrice(5_000_000L).version(0L).build();
        when(pricingService.updatePrice(eq(1L), eq(7L), any(UpdatePriceRequest.class)))
                .thenThrow(new ObjectOptimisticLockingFailureException(FacilityUnitTypePrice.class, 10L));

        mockMvc.perform(put("/facilities/1/prices/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.errorCode").value("OPTIMISTIC_LOCK_CONFLICT"));
    }

    @Test
    @WithMockUser(roles = "BUSINESS_OPERATIONS_MANAGER")
    @DisplayName("CON-02 (Tech Lead Guardrail #1): GlobalExceptionHandler bắt CustomException(UNIT_TYPE_INACTIVE) trả về HTTP 409 Conflict")
    void shouldReturn409Conflict_whenUnitTypeInactiveThrown() throws Exception {
        UpdatePriceRequest req = new UpdatePriceRequest(5_000_000L);
        when(pricingService.updatePrice(eq(1L), eq(7L), any(UpdatePriceRequest.class)))
                .thenThrow(new CustomException(ErrorCode.UNIT_TYPE_INACTIVE));

        mockMvc.perform(put("/facilities/1/prices/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.errorCode").value("UNIT_TYPE_INACTIVE"));
    }
}
