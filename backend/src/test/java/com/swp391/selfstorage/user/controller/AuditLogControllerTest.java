package com.swp391.selfstorage.user.controller;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.user.dto.AuditLogResponse;
import com.swp391.selfstorage.user.dto.LoginHistoryResponse;
import com.swp391.selfstorage.user.service.AuditLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuditLogController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    @DisplayName("GET /audit/logins trả về danh sách lịch sử đăng nhập 200 OK")
    void testGetLoginHistories() throws Exception {
        LoginHistoryResponse response = LoginHistoryResponse.builder()
                .id(1L)
                .userId(10L)
                .email("admin@storage.com")
                .ipAddress("127.0.0.1")
                .userAgent("Chrome")
                .isSuccess(true)
                .loggedInAt(OffsetDateTime.now())
                .build();

        PageResponse<LoginHistoryResponse> page = new PageResponse<>(List.of(response), 0, 20, 1, 1);
        when(auditLogService.getLoginHistories(any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/audit/logins"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].email").value("admin@storage.com"))
                .andExpect(jsonPath("$.content[0].success").value(true));
    }

    @Test
    @DisplayName("GET /audit/activities trả về danh sách nhật ký hoạt động 200 OK")
    void testGetAuditLogs() throws Exception {
        AuditLogResponse response = AuditLogResponse.builder()
                .id(5L)
                .userId(1L)
                .userEmail("admin@storage.com")
                .userFullName("Admin User")
                .action("CREATE_USER")
                .entityType("AppUser")
                .entityId(2L)
                .createdAt(OffsetDateTime.now())
                .build();

        PageResponse<AuditLogResponse> page = new PageResponse<>(List.of(response), 0, 20, 1, 1);
        when(auditLogService.getAuditLogs(any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/audit/activities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(5))
                .andExpect(jsonPath("$.content[0].action").value("CREATE_USER"))
                .andExpect(jsonPath("$.content[0].userEmail").value("admin@storage.com"));
    }

    @Test
    @DisplayName("GET /audit/activities/export trả về file CSV tải về 200 OK")
    void testExportAuditLogsCsv() throws Exception {
        byte[] csvData = "ID,Email,Action\n1,admin@storage.com,LOGIN".getBytes(StandardCharsets.UTF_8);
        when(auditLogService.exportAuditLogsCsv(any())).thenReturn(csvData);

        mockMvc.perform(get("/audit/activities/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv;charset=UTF-8"))
                .andExpect(header().exists("Content-Disposition"))
                .andExpect(content().bytes(csvData));
    }
}
