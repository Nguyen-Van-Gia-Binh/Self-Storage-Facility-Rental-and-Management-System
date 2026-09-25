package com.swp391.selfstorage.common.config;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.facility.controller.FacilityController;
import com.swp391.selfstorage.facility.service.FacilityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FacilityController.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FacilityService facilityService;

    @Test
    @DisplayName("GET /facilities được phép truy cập ẩn danh (permitAll) mà không cần Token")
    void testPublicFacilitiesEndpointPermitAll() throws Exception {
        when(facilityService.getFacilities(any(), any(), any()))
                .thenReturn(new PageResponse<>());

        mockMvc.perform(get("/facilities"))
                .andExpect(status().isOk());
    }
}
