package com.swp391.selfstorage.facility.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.facility.dto.CreateFacilityRequest;
import com.swp391.selfstorage.facility.dto.FacilityResponse;
import com.swp391.selfstorage.facility.dto.UpdateFacilityStatusRequest;
import com.swp391.selfstorage.facility.service.FacilityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FacilityController.class)
@AutoConfigureMockMvc(addFilters = false)
class FacilityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FacilityService facilityService;

    @Test
    @DisplayName("GET /facilities trả về danh sách phân trang 200 OK")
    void testGetFacilities() throws Exception {
        FacilityResponse res = new FacilityResponse();
        res.setId(1L);
        res.setCode("FAC-CG");
        res.setName("Kho Cầu Giấy");

        PageResponse<FacilityResponse> pageRes = new PageResponse<>(List.of(res), 0, 20, 1, 1);
        when(facilityService.getFacilities(any(), any(), any(Pageable.class))).thenReturn(pageRes);

        mockMvc.perform(get("/facilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].code").value("FAC-CG"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("POST /facilities tạo mới trả về 201 Created")
    void testCreateFacility() throws Exception {
        CreateFacilityRequest req = new CreateFacilityRequest();
        req.setCode("FAC-NEW");
        req.setName("Kho Mới");
        req.setAddress("123 Duy Tân");

        FacilityResponse res = new FacilityResponse();
        res.setId(2L);
        res.setCode("FAC-NEW");
        res.setName("Kho Mới");

        when(facilityService.createFacility(any(CreateFacilityRequest.class))).thenReturn(res);

        mockMvc.perform(post("/facilities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.code").value("FAC-NEW"));
    }

    @Test
    @DisplayName("PATCH /facilities/{id}/status cập nhật trạng thái thành công 200 OK")
    void testUpdateStatus() throws Exception {
        UpdateFacilityStatusRequest req = new UpdateFacilityStatusRequest(false);
        FacilityResponse res = new FacilityResponse();
        res.setId(1L);
        res.setActive(false);

        when(facilityService.updateFacilityStatus(eq(1L), any(UpdateFacilityStatusRequest.class))).thenReturn(res);

        mockMvc.perform(patch("/facilities/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }
}
