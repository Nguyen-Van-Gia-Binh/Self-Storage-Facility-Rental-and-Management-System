package com.swp391.selfstorage.unit.controller;

import com.swp391.selfstorage.unit.dto.AvailabilityResponse;
import com.swp391.selfstorage.unit.service.AvailabilityService;
import com.swp391.selfstorage.unit.service.UnitTypeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UnitTypeController.class)
@AutoConfigureMockMvc(addFilters = false)
class UnitTypeAvailabilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UnitTypeService unitTypeService;

    @MockBean
    private AvailabilityService availabilityService;

    @Test
    @DisplayName("GET /api/v1/facilities/{facilityId}/unit-types/{unitTypeId}/availability trả về 200 và DTO đúng cấu trúc")
    void testCheckAvailabilitySuccess() throws Exception {
        AvailabilityResponse response = AvailabilityResponse.builder()
                .facilityId(1L)
                .unitTypeId(7L)
                .startDate(LocalDate.of(2026, 10, 1))
                .endDateExclusive(LocalDate.of(2027, 1, 1))
                .rentalMonths(3)
                .availableSlots(3L)
                .monthlyPrice(800000L)
                .totalRentalFee(2400000L)
                .depositAmount(800000L)
                .build();

        when(availabilityService.checkAvailability(eq(1L), eq(7L), eq(LocalDate.of(2026, 10, 1)), eq(3)))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/facilities/1/unit-types/7/availability")
                        .param("startDate", "2026-10-01")
                        .param("rentalMonths", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.facilityId").value(1))
                .andExpect(jsonPath("$.unitTypeId").value(7))
                .andExpect(jsonPath("$.startDate").value("2026-10-01"))
                .andExpect(jsonPath("$.endDateExclusive").value("2027-01-01"))
                .andExpect(jsonPath("$.rentalMonths").value(3))
                .andExpect(jsonPath("$.availableSlots").value(3))
                .andExpect(jsonPath("$.monthlyPrice").value(800000))
                .andExpect(jsonPath("$.totalRentalFee").value(2400000))
                .andExpect(jsonPath("$.depositAmount").value(800000));
    }
}
