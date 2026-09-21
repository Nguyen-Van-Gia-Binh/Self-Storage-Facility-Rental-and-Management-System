package com.swp391.selfstorage.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.support.dto.AssignStaffRequest;
import com.swp391.selfstorage.support.dto.ResolveSupportRequest;
import com.swp391.selfstorage.support.dto.StaffWorkloadResponse;
import com.swp391.selfstorage.support.dto.SupportRequestDetailResponse;
import com.swp391.selfstorage.support.dto.SupportRequestSummaryResponse;
import com.swp391.selfstorage.support.entity.SupportCategory;
import com.swp391.selfstorage.support.entity.SupportStatus;
import com.swp391.selfstorage.support.service.StaffSupportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StaffSupportController.class)
@AutoConfigureMockMvc(addFilters = false)
class StaffSupportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StaffSupportService staffSupportService;

    @Test
    @DisplayName("PATCH /api/v1/support-requests/{id}/assign trả về 200 OK khi phân công hợp lệ")
    void testAssignStaff_success() throws Exception {
        AssignStaffRequest request = AssignStaffRequest.builder()
                .staffId(8L)
                .note("Hỗ trợ mở khóa")
                .build();

        SupportRequestDetailResponse response = SupportRequestDetailResponse.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .status(SupportStatus.ASSIGNED)
                .assignedStaffId(8L)
                .assignedStaffName("Trần Thị Nhân Viên")
                .build();

        when(staffSupportService.assignStaff(eq(801L), any(AssignStaffRequest.class), any()))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/support-requests/801/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(801))
                .andExpect(jsonPath("$.data.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.data.assignedStaffId").value(8))
                .andExpect(jsonPath("$.data.assignedStaffName").value("Trần Thị Nhân Viên"));
    }

    @Test
    @DisplayName("PATCH /api/v1/support-requests/{id}/assign trả về 400 Bad Request khi thiếu staffId")
    void testAssignStaff_validationError() throws Exception {
        AssignStaffRequest request = new AssignStaffRequest(null, "Note");

        mockMvc.perform(patch("/api/v1/support-requests/801/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /api/v1/support-requests/{id}/in-progress trả về 200 OK")
    void testStartInProgress_success() throws Exception {
        SupportRequestDetailResponse response = SupportRequestDetailResponse.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .status(SupportStatus.IN_PROGRESS)
                .build();

        when(staffSupportService.startInProgress(eq(801L), any()))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/support-requests/801/in-progress"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("PATCH /api/v1/support-requests/{id}/resolve trả về 200 OK khi giải quyết sự cố")
    void testResolveSupportRequest_success() throws Exception {
        ResolveSupportRequest request = ResolveSupportRequest.builder()
                .resolutionNote("Đã cấp lại mã PIN thành công")
                .resolutionAttachmentUrls(List.of("https://cdn.example.com/res.jpg"))
                .build();

        SupportRequestDetailResponse response = SupportRequestDetailResponse.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .status(SupportStatus.RESOLVED)
                .resolutionNote("Đã cấp lại mã PIN thành công")
                .resolvedAt(OffsetDateTime.now())
                .build();

        when(staffSupportService.resolveSupportRequest(eq(801L), any(ResolveSupportRequest.class), any()))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/support-requests/801/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.status").value("RESOLVED"))
                .andExpect(jsonPath("$.data.resolutionNote").value("Đã cấp lại mã PIN thành công"));
    }

    @Test
    @DisplayName("GET /api/v1/support-requests/staff-workload trả về danh sách tải công việc")
    void testGetStaffWorkload_success() throws Exception {
        StaffWorkloadResponse workload = StaffWorkloadResponse.builder()
                .staffId(8L)
                .staffName("Trần Thị Nhân Viên")
                .facilityId(1L)
                .activeTaskCount(2L)
                .completedTaskCount(5L)
                .build();

        when(staffSupportService.getStaffWorkload(eq(1L), any()))
                .thenReturn(List.of(workload));

        mockMvc.perform(get("/api/v1/support-requests/staff-workload")
                        .param("facilityId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].staffId").value(8))
                .andExpect(jsonPath("$.data[0].activeTaskCount").value(2));
    }

    @Test
    @DisplayName("GET /api/v1/management/support-requests trả về danh sách phân trang")
    void testGetManagementSupportRequests_success() throws Exception {
        SupportRequestSummaryResponse item = SupportRequestSummaryResponse.builder()
                .id(801L)
                .code("SUP-202610-0001")
                .category(SupportCategory.LOCK_ACCESS)
                .status(SupportStatus.NEW)
                .build();

        PageResponse<SupportRequestSummaryResponse> pageResponse = new PageResponse<>(
                List.of(item), 0, 10, 1, 1
        );

        when(staffSupportService.getManagementSupportRequests(any(), any(), any(), any(), any(), any()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/management/support-requests")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content[0].code").value("SUP-202610-0001"));
    }
}
