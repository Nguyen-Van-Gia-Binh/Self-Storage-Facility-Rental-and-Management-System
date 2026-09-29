package com.swp391.selfstorage.report.controller;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.report.dto.*;
import com.swp391.selfstorage.report.service.SystemReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SystemReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class SystemReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SystemReportService systemReportService;

    @Test
    @DisplayName("GET /reports/system/revenue - Lấy báo cáo doanh thu trả về 200 OK")
    void testGetSystemRevenueReport_Success() throws Exception {
        SystemRevenueReportResponse mockResponse = SystemRevenueReportResponse.builder()
                .from("2026-10-01")
                .to("2026-10-31")
                .totalRevenue(13_700_000L)
                .rentalRevenue(13_000_000L)
                .surchargeRevenue(200_000L)
                .overdueFeeRevenue(500_000L)
                .byFacility(List.of(
                        FacilityRevenueShareDto.builder().facilityId(1L).facilityName("Cơ sở Cầu Giấy")
                                .revenue(5_700_000L).build(),
                        FacilityRevenueShareDto.builder().facilityId(2L).facilityName("Cơ sở Đống Đa")
                                .revenue(8_000_000L).build()))
                .build();

        when(systemReportService.getSystemRevenueReport(any(), any(), any())).thenReturn(mockResponse);

        mockMvc.perform(get("/reports/system/revenue")
                .param("from", "2026-10-01")
                .param("to", "2026-10-31")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.from").value("2026-10-01"))
                .andExpect(jsonPath("$.data.to").value("2026-10-31"))
                .andExpect(jsonPath("$.data.totalRevenue").value(13700000))
                .andExpect(jsonPath("$.data.rentalRevenue").value(13000000))
                .andExpect(jsonPath("$.data.surchargeRevenue").value(200000))
                .andExpect(jsonPath("$.data.overdueFeeRevenue").value(500000))
                .andExpect(jsonPath("$.data.byFacility.length()").value(2));
    }

    @Test
    @DisplayName("GET /reports/system/occupancy - Lấy báo cáo tỷ lệ lấp đầy trả về 200 OK")
    void testGetSystemOccupancyReport_Success() throws Exception {
        SystemOccupancyReportResponse mockResponse = SystemOccupancyReportResponse.builder()
                .overallOccupancyRate(0.625)
                .totalUnits(8)
                .totalOccupiedUnits(5)
                .totalAvailableUnits(3)
                .facilities(List.of(
                        FacilityOccupancyDetailDto.builder()
                                .facilityId(2L)
                                .facilityName("Cơ sở Đống Đa")
                                .totalUnits(4)
                                .occupiedUnits(3)
                                .availableUnits(1)
                                .occupancyRate(0.75)
                                .build()))
                .build();

        when(systemReportService.getSystemOccupancyReport(any())).thenReturn(mockResponse);

        mockMvc.perform(get("/reports/system/occupancy")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.overallOccupancyRate").value(0.625))
                .andExpect(jsonPath("$.data.totalUnits").value(8))
                .andExpect(jsonPath("$.data.totalOccupiedUnits").value(5))
                .andExpect(jsonPath("$.data.totalAvailableUnits").value(3))
                .andExpect(jsonPath("$.data.facilities[0].facilityId").value(2))
                .andExpect(jsonPath("$.data.facilities[0].occupancyRate").value(0.75));
    }

    @Test
    @DisplayName("GET /reports/system/occupancy - facilityId=all được xử lý như toàn hệ thống (BM-04)")
    void testGetSystemOccupancyReport_FacilityIdAll() throws Exception {
        SystemOccupancyReportResponse mockResponse = SystemOccupancyReportResponse.builder()
                .overallOccupancyRate(0.5)
                .totalUnits(10)
                .totalOccupiedUnits(5)
                .totalAvailableUnits(5)
                .facilities(List.of())
                .build();

        when(systemReportService.getSystemOccupancyReport(eq(null))).thenReturn(mockResponse);

        mockMvc.perform(get("/reports/system/occupancy")
                        .param("facilityId", "all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.totalUnits").value(10))
                .andExpect(jsonPath("$.data.totalOccupiedUnits").value(5));
    }

    @Test
    @DisplayName("GET /reports/system/revenue - facilityId=all được xử lý như toàn hệ thống (BM-04)")
    void testGetSystemRevenueReport_FacilityIdAll() throws Exception {
        SystemRevenueReportResponse mockResponse = SystemRevenueReportResponse.builder()
                .from("2026-09-01")
                .to("2026-09-30")
                .totalRevenue(1_000_000L)
                .rentalRevenue(1_000_000L)
                .byFacility(List.of())
                .build();

        when(systemReportService.getSystemRevenueReport(any(), any(), eq(null))).thenReturn(mockResponse);

        mockMvc.perform(get("/reports/system/revenue")
                        .param("from", "2026-09-01")
                        .param("to", "2026-09-30")
                        .param("facilityId", "all")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.totalRevenue").value(1000000));
    }

        @Test
    @DisplayName("GET /reports/system/overdue - Lấy danh sách hợp đồng quá hạn trả về 200 OK")
    void testGetSystemOverdueContracts_Success() throws Exception {
        PageResponse<OverdueContractDetailDto> mockPage = PageResponse.from(
                new org.springframework.data.domain.PageImpl<>(
                        List.of(OverdueContractDetailDto.builder()
                                .contractId(1L)
                                .contractCode("CTR-001")
                                .customerName("Nguyễn Văn A")
                                .overdueDays(5)
                                .accruedOverdueFee(500_000L)
                                .build())
                )
        );

        when(systemReportService.getSystemOverdueContracts(any(), any(), any())).thenReturn(mockPage);

        mockMvc.perform(get("/reports/system/overdue")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].contractCode").value("CTR-001"))
                .andExpect(jsonPath("$.data.content[0].overdueDays").value(5));
    }

    @Test
    @DisplayName("GET /reports/system/export - Xuất file CSV trả về 200 OK với đúng Headers")
    void testExportSystemReport_Success() throws Exception {
        byte[] mockBytes = "mock csv content".getBytes(java.nio.charset.StandardCharsets.UTF_8);

        when(systemReportService.exportSystemReport(any(), any(), any(), any(), any())).thenReturn(mockBytes);

        mockMvc.perform(get("/reports/system/export")
                        .param("type", "REVENUE")
                        .param("format", "CSV"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("attachment; filename=\"report_revenue_")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string(org.springframework.http.HttpHeaders.CONTENT_TYPE, org.hamcrest.Matchers.startsWith("text/csv")));
    }

}
