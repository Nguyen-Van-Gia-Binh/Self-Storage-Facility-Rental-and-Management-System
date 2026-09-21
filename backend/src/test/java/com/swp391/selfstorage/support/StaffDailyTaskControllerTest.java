package com.swp391.selfstorage.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.support.dto.*;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.service.StaffDailyTaskService;
import com.swp391.selfstorage.user.entity.UserRole;
import com.swp391.selfstorage.user.entity.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StaffDailyTaskController.class)
@AutoConfigureMockMvc(addFilters = false)
class StaffDailyTaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StaffDailyTaskService staffDailyTaskService;

    private UserPrincipal staffPrincipal;
    private StaffDailyTasksResponse sampleResponse;

    @BeforeEach
    void setUp() {
        staffPrincipal = new UserPrincipal(8L, "staff@test.com", "hash", "Trần Văn Staff",
                UserRole.FACILITY_STAFF, UserStatus.ACTIVE, List.of(1L), Collections.emptyList());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(staffPrincipal, null, staffPrincipal.getAuthorities())
        );

        DailyCheckInTaskDto checkInTask = DailyCheckInTaskDto.builder()
                .contractId(501L)
                .contractCode("CTR-001")
                .customerId(15L)
                .customerName("Nguyễn Văn A")
                .customerPhone("0901234567")
                .storageUnitId(101L)
                .storageUnitCode("S-101")
                .facilityId(1L)
                .facilityName("Kho Thủ Đức Central")
                .scheduledDate(LocalDate.of(2026, 10, 1))
                .status("PENDING")
                .completed(false)
                .build();

        DailyReturnTaskDto returnTask = DailyReturnTaskDto.builder()
                .contractId(502L)
                .contractCode("CTR-002")
                .customerId(16L)
                .customerName("Trần Văn B")
                .customerPhone("0987654321")
                .storageUnitId(102L)
                .storageUnitCode("S-102")
                .facilityId(1L)
                .facilityName("Kho Thủ Đức Central")
                .scheduledDate(LocalDate.of(2026, 10, 1))
                .status("PENDING")
                .completed(false)
                .build();

        DailySupportTaskDto supportTask = DailySupportTaskDto.builder()
                .supportRequestId(301L)
                .code("SR-001")
                .category(SupportCategory.LOCK_ACCESS)
                .categoryDisplayName(SupportCategory.LOCK_ACCESS.getDisplayName())
                .description("Hỏng khóa")
                .storageUnitId(101L)
                .storageUnitCode("S-101")
                .facilityId(1L)
                .facilityName("Kho Thủ Đức Central")
                .isUrgent(true)
                .slaDueAt(OffsetDateTime.now().plusHours(2))
                .status(SupportStatus.ASSIGNED)
                .statusDisplayName("Đã phân công")
                .completed(false)
                .build();

        DailyTasksSummaryDto summary = DailyTasksSummaryDto.builder()
                .totalTasks(3)
                .pendingTasks(3)
                .completedTasks(0)
                .urgentTasks(1)
                .checkInCount(1)
                .returnCount(1)
                .supportCount(1)
                .build();

        sampleResponse = StaffDailyTasksResponse.builder()
                .date(LocalDate.of(2026, 10, 1))
                .staffId(8L)
                .staffName("Trần Văn Staff")
                .facilityId(1L)
                .facilityName("Kho Thủ Đức Central")
                .summary(summary)
                .checkInTasks(List.of(checkInTask))
                .returnTasks(List.of(returnTask))
                .supportTasks(List.of(supportTask))
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/staff/daily-tasks trả về 200 OK kèm dữ liệu 3 nhóm task và thống kê")
    void testGetMyDailyTasks_success() throws Exception {
        when(staffDailyTaskService.getDailyTasks(eq(8L), any(), any(), any()))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/staff/daily-tasks")
                        .principal(new UsernamePasswordAuthenticationToken(staffPrincipal, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.staffId").value(8))
                .andExpect(jsonPath("$.data.staffName").value("Trần Văn Staff"))
                .andExpect(jsonPath("$.data.facilityName").value("Kho Thủ Đức Central"))
                .andExpect(jsonPath("$.data.summary.totalTasks").value(3))
                .andExpect(jsonPath("$.data.summary.pendingTasks").value(3))
                .andExpect(jsonPath("$.data.checkInTasks").isArray())
                .andExpect(jsonPath("$.data.checkInTasks[0].contractCode").value("CTR-001"))
                .andExpect(jsonPath("$.data.returnTasks[0].contractCode").value("CTR-002"))
                .andExpect(jsonPath("$.data.supportTasks[0].code").value("SR-001"))
                // API-SPEC § 12 aliases
                .andExpect(jsonPath("$.data.pendingCheckIns").isArray())
                .andExpect(jsonPath("$.data.pendingReturns").isArray())
                .andExpect(jsonPath("$.data.openSupportRequests").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/staff/{staffId}/daily-tasks trả về 200 OK khi truyền staffId")
    void testGetStaffDailyTasks_success() throws Exception {
        when(staffDailyTaskService.getDailyTasks(eq(8L), any(), any(), any()))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/staff/8/daily-tasks")
                        .principal(new UsernamePasswordAuthenticationToken(staffPrincipal, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.staffId").value(8));
    }

    @Test
    @DisplayName("GET /api/v1/reports/staff/{staffId}/daily-tasks khớp đúng API-SPEC § 12")
    void testGetStaffDailyTasksReport_success() throws Exception {
        when(staffDailyTaskService.getDailyTasks(eq(8L), any(), any(), any()))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/reports/staff/8/daily-tasks")
                        .principal(new UsernamePasswordAuthenticationToken(staffPrincipal, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.date").value("2026-10-01"))
                .andExpect(jsonPath("$.data.staffId").value(8))
                .andExpect(jsonPath("$.data.pendingCheckIns").isArray())
                .andExpect(jsonPath("$.data.pendingReturns").isArray())
                .andExpect(jsonPath("$.data.openSupportRequests").isArray());
    }

    @Test
    @DisplayName("Hỗ trợ query parameters date và pendingOnly")
    void testGetDailyTasks_withQueryParams() throws Exception {
        LocalDate customDate = LocalDate.of(2026, 11, 15);
        when(staffDailyTaskService.getDailyTasks(eq(8L), eq(customDate), eq(true), any()))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/staff/daily-tasks")
                        .param("date", "2026-11-15")
                        .param("pendingOnly", "true")
                        .principal(new UsernamePasswordAuthenticationToken(staffPrincipal, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }
}
