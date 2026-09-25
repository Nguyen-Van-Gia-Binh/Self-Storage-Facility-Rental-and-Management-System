package com.swp391.selfstorage.unit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.unit.dto.CreateUnitTypeRequest;
import com.swp391.selfstorage.unit.dto.UnitTypeResponse;
import com.swp391.selfstorage.unit.service.UnitTypeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UnitTypeController.class)
@AutoConfigureMockMvc(addFilters = false)
class UnitTypeControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean private UnitTypeService unitTypeService;
    @MockBean private com.swp391.selfstorage.unit.service.AvailabilityService availabilityService;

    @Test
    @DisplayName("GET /api/v1/facilities/{facilityId}/unit-types trả về 200 kèm PageResponse")
    void testGetUnitTypes() throws Exception {
        UnitTypeResponse item = UnitTypeResponse.builder()
                .id(7L)
                .facilityId(1L)
                .code("UT-S")
                .name("Loại S — 3m²")
                .monthlyPrice(800000L)
                .build();

        when(unitTypeService.getUnitTypesByFacility(eq(1L), any(), any()))
                .thenReturn(new PageResponse<>(List.of(item), 0, 20, 1, 1));

        mockMvc.perform(get("/facilities/1/unit-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Loại S — 3m²"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("POST /facilities/{facilityId}/unit-types tạo mới trả về 201")
    void testCreateUnitType() throws Exception {
        CreateUnitTypeRequest req = CreateUnitTypeRequest.builder()
                .code("UT-M")
                .name("Loại M — 6m²")
                .widthM(new BigDecimal("2.0"))
                .depthM(new BigDecimal("3.0"))
                .heightM(new BigDecimal("2.5"))
                .monthlyPrice(1500000L)
                .build();

        UnitTypeResponse res = UnitTypeResponse.builder()
                .id(8L)
                .facilityId(1L)
                .name("Loại M — 6m²")
                .build();

        when(unitTypeService.createUnitType(eq(1L), any(CreateUnitTypeRequest.class))).thenReturn(res);

        mockMvc.perform(post("/facilities/1/unit-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Loại M — 6m²"));
    }
}
