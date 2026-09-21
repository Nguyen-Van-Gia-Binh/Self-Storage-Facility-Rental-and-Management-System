package com.swp391.selfstorage.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.support.dto.ConfirmResolutionRequest;
import com.swp391.selfstorage.support.dto.CreateSupportRequest;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.service.CustomerSupportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomerSupportController.class)
@AutoConfigureMockMvc(addFilters = false)
class CustomerSupportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerSupportService customerSupportService;

    @Test
    @DisplayName("POST /api/v1/support-requests trả về 201 Created khi tạo yêu cầu hợp lệ")
    void testCreateSupportRequest() throws Exception {
        CreateSupportRequest request = CreateSupportRequest.builder()
                .category(SupportCategory.LOCK_ACCESS)
                .description("Bàn phím nhập mã PIN bị liệt số 5")
                .isUrgent(true)
                .build();

        SupportRequestDetailResponse response = SupportRequestDetailResponse.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .customerId(15L)
                .category(SupportCategory.LOCK_ACCESS)
                .description("Bàn phím nhập mã PIN bị liệt số 5")
                .status(SupportStatus.NEW)
                .isUrgent(true)
                .slaDueAt(OffsetDateTime.now().plusHours(2))
                .build();

        when(customerSupportService.createSupportRequest(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/support-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(801))
                .andExpect(jsonPath("$.data.code").value("SUP-202610-0001"));
    }

    @Test
    @DisplayName("GET /api/v1/support-requests trả về 200 OK kèm danh sách phân trang")
    void testGetMySupportRequests() throws Exception {
        SupportRequestSummaryResponse summary = SupportRequestSummaryResponse.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .status(SupportStatus.NEW)
                .build();

        PageResponse<SupportRequestSummaryResponse> page = new PageResponse<>(List.of(summary), 0, 10, 1, 1);
        when(customerSupportService.getMySupportRequests(any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/support-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content[0].code").value("SUP-202610-0001"));
    }

    @Test
    @DisplayName("GET /api/v1/support-requests/{id} trả về 200 OK kèm chi tiết")
    void testGetSupportRequestDetail() throws Exception {
        SupportRequestDetailResponse response = SupportRequestDetailResponse.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .status(SupportStatus.NEW)
                .build();

        when(customerSupportService.getSupportRequestDetail(eq(801L), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/support-requests/801"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.code").value("SUP-202610-0001"));
    }

    @Test
    @DisplayName("PATCH /api/v1/support-requests/{id}/confirm trả về 200 OK")
    void testConfirmResolution() throws Exception {
        ConfirmResolutionRequest request = ConfirmResolutionRequest.builder()
                .satisfied(true)
                .feedback("Hài lòng")
                .build();

        SupportRequestDetailResponse response = SupportRequestDetailResponse.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .status(SupportStatus.CLOSED)
                .build();

        when(customerSupportService.confirmResolution(eq(801L), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/support-requests/801/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.status").value("CLOSED"));
    }

    @Test
    @DisplayName("DELETE /api/v1/support-requests/{id} trả về 204 No Content")
    void testCancelSupportRequest() throws Exception {
        doNothing().when(customerSupportService).cancelSupportRequest(eq(801L), any());

        mockMvc.perform(delete("/api/v1/support-requests/801"))
                .andExpect(status().isNoContent());
    }
}
