package com.swp391.selfstorage.unit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.unit.dto.CreateStorageUnitRequest;
import com.swp391.selfstorage.unit.dto.StorageUnitResponse;
import com.swp391.selfstorage.unit.dto.UpdateStorageUnitStatusRequest;
import com.swp391.selfstorage.unit.entity.StorageUnitStatus;
import com.swp391.selfstorage.unit.service.StorageUnitService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StorageUnitController.class)
@AutoConfigureMockMvc(addFilters = false)
class StorageUnitControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean private StorageUnitService storageUnitService;

    @Test
    @DisplayName("GET /api/v1/facilities/{facilityId}/storage-units trả về danh sách ô kho")
    void testGetStorageUnits() throws Exception {
        StorageUnitResponse unit = StorageUnitResponse.builder()
                .id(42L)
                .code("S-101")
                .status(StorageUnitStatus.AVAILABLE)
                .build();

        when(storageUnitService.getStorageUnitsByFacility(eq(1L), any(), any(), any()))
                .thenReturn(new PageResponse<>(List.of(unit), 0, 20, 1, 1));

        mockMvc.perform(get("/facilities/1/storage-units"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].code").value("S-101"));
    }

    @Test
    @DisplayName("PATCH /facilities/{facilityId}/storage-units/{unitId}/status đổi trạng thái ô kho trả về 200")
    void testPatchStatus() throws Exception {
        UpdateStorageUnitStatusRequest req = UpdateStorageUnitStatusRequest.builder()
                .status(StorageUnitStatus.MAINTENANCE)
                .reason("Sửa khóa cửa")
                .build();

        StorageUnitResponse res = StorageUnitResponse.builder()
                .id(42L)
                .status(StorageUnitStatus.MAINTENANCE)
                .build();

        when(storageUnitService.updateStorageUnitStatus(eq(1L), eq(42L), any(UpdateStorageUnitStatusRequest.class)))
                .thenReturn(res);

        mockMvc.perform(patch("/facilities/1/storage-units/42/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("MAINTENANCE"));
    }
}
