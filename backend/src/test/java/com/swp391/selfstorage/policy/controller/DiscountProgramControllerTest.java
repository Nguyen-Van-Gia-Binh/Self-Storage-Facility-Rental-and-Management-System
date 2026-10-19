package com.swp391.selfstorage.policy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.policy.dto.CreateDiscountProgramRequest;
import com.swp391.selfstorage.policy.dto.DiscountProgramResponse;
import com.swp391.selfstorage.policy.service.DiscountProgramService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DiscountProgramController.class)
@AutoConfigureMockMvc(addFilters = false)
class DiscountProgramControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DiscountProgramService discountProgramService;

    @Test
    @DisplayName("GET /discount-programs trả về 200 OK với danh sách ưu đãi")
    void testGetDiscountPrograms() throws Exception {
        PageResponse<DiscountProgramResponse> page = new PageResponse<>(
                List.of(DiscountProgramResponse.builder()
                        .id(1L)
                        .name("Giảm 5% cho 6 tháng")
                        .discountType("PERCENT")
                        .discountValue(BigDecimal.valueOf(5))
                        .minRentalMonths(6)
                        .startDate(LocalDate.now())
                        .endDate(LocalDate.now().plusMonths(3))
                        .scopeType("SYSTEM")
                        .isActive(true)
                        .build()),
                0, 20, 1L, 1
        );
        when(discountProgramService.getDiscountPrograms(any(), any())).thenReturn(page);

        mockMvc.perform(get("/discount-programs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Giảm 5% cho 6 tháng"));
    }

    @Test
    @DisplayName("POST /discount-programs trả về 201 Created khi tạo thành công")
    void testCreateDiscountProgram_Success() throws Exception {
        CreateDiscountProgramRequest req = CreateDiscountProgramRequest.builder()
                .name("Ưu đãi hè 2026")
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(10))
                .minRentalMonths(6)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .scopeType("SYSTEM")
                .build();

        DiscountProgramResponse res = DiscountProgramResponse.builder()
                .id(10L)
                .name("Ưu đãi hè 2026")
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(10))
                .minRentalMonths(6)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .scopeType("SYSTEM")
                .isActive(true)
                .build();

        when(discountProgramService.createDiscountProgram(any())).thenReturn(res);

        mockMvc.perform(post("/discount-programs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.name").value("Ưu đãi hè 2026"));
    }
}
