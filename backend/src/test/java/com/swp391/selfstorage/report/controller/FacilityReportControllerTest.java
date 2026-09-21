package com.swp391.selfstorage.report.controller;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.contract.dto.ContractSummaryResponse;
import com.swp391.selfstorage.contract.entity.ContractStatus;
import com.swp391.selfstorage.report.dto.DebtAgeBracket;
import com.swp391.selfstorage.report.dto.FacilityOverviewReportResponse;
import com.swp391.selfstorage.report.dto.OverdueDebtReportResponse;
import com.swp391.selfstorage.report.service.FacilityReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FacilityReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class FacilityReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FacilityReportService facilityReportService;

    @Test
    @DisplayName("GET /api/v1/reports/facility/{id}/overview - Lấy báo cáo tổng quan trả về 200 OK")
    void testGetFacilityOverview_Success() throws Exception {
        FacilityOverviewReportResponse mockResponse = FacilityOverviewReportResponse.builder()
                .facilityId(1L)
                .facilityName("Kho Quận 1")
                .month("2026-10")
                .totalUnits(30)
                .availableUnits(5)
                .occupiedUnits(22)
                .maintenanceUnits(3)
                .occupancyRate(0.733)
                .activeContracts(22)
                .overdueContracts(2)
                .newContracts(5)
                .returnedContracts(3)
                .totalRevenue(25_600_000L)
                .rentalRevenue(24_000_000L)
                .surchargeRevenue(1_600_000L)
                .depositBalance(17_600_000L)
                .build();

        when(facilityReportService.getFacilityOverview(eq(1L), eq("2026-10"), any()))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/reports/facility/1/overview")
                        .param("month", "2026-10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.facilityId").value(1))
                .andExpect(jsonPath("$.data.facilityName").value("Kho Quận 1"))
                .andExpect(jsonPath("$.data.month").value("2026-10"))
                .andExpect(jsonPath("$.data.totalUnits").value(30))
                .andExpect(jsonPath("$.data.occupiedUnits").value(22))
                .andExpect(jsonPath("$.data.occupancyRate").value(0.733))
                .andExpect(jsonPath("$.data.totalRevenue").value(25600000))
                .andExpect(jsonPath("$.data.rentalRevenue").value(24000000))
                .andExpect(jsonPath("$.data.surchargeRevenue").value(1600000))
                .andExpect(jsonPath("$.data.depositBalance").value(17600000));
    }

    @Test
    @DisplayName("GET /api/v1/reports/facility/{id}/contracts - Lấy danh sách hợp đồng phân trang trả về 200 OK")
    void testGetFacilityContracts_Success() throws Exception {
        ContractSummaryResponse c = ContractSummaryResponse.builder()
                .id(101L)
                .code("CTR-101")
                .facilityId(1L)
                .status(ContractStatus.ACTIVE)
                .monthlyPrice(2_000_000L)
                .build();

        PageResponse<ContractSummaryResponse> mockPage = new PageResponse<>(
                List.of(c), 0, 10, 1, 1
        );

        when(facilityReportService.getFacilityContracts(eq(1L), any(), any(), any(), any()))
                .thenReturn(mockPage);

        mockMvc.perform(get("/api/v1/reports/facility/1/contracts")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content[0].id").value(101))
                .andExpect(jsonPath("$.data.content[0].code").value("CTR-101"))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/reports/facility/{id}/overdue-debt - Lấy báo cáo rủi ro nợ quá hạn trả về 200 OK")
    void testGetFacilityOverdueDebt_Success() throws Exception {
        OverdueDebtReportResponse mockResponse = OverdueDebtReportResponse.builder()
                .facilityId(1L)
                .facilityName("Kho Quận 1")
                .totalOverdueContracts(2)
                .totalOverdueDebt(5_000_000L)
                .bracketD1ToD10(DebtAgeBracket.builder().bracketCode("D1_TO_D10").contractCount(1).totalDebt(1_000_000L).contracts(Collections.emptyList()).build())
                .bracketD11ToD30(DebtAgeBracket.builder().bracketCode("D11_TO_D30").contractCount(1).totalDebt(4_000_000L).contracts(Collections.emptyList()).build())
                .bracketOverD30(DebtAgeBracket.builder().bracketCode("OVER_D30").contractCount(0).totalDebt(0L).contracts(Collections.emptyList()).build())
                .contracts(Collections.emptyList())
                .build();

        when(facilityReportService.getFacilityOverdueDebt(eq(1L), any()))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/reports/facility/1/overdue-debt")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.facilityId").value(1))
                .andExpect(jsonPath("$.data.totalOverdueContracts").value(2))
                .andExpect(jsonPath("$.data.totalOverdueDebt").value(5000000))
                .andExpect(jsonPath("$.data.bracketD1ToD10.totalDebt").value(1000000))
                .andExpect(jsonPath("$.data.bracketD11ToD30.totalDebt").value(4000000));
    }
}
