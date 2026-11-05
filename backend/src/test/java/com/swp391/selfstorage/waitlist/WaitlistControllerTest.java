package com.swp391.selfstorage.waitlist;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.selfstorage.waitlist.dto.CreateWaitlistRequest;
import com.swp391.selfstorage.waitlist.dto.WaitlistResponse;
import com.swp391.selfstorage.waitlist.entity.WaitlistStatus;
import com.swp391.selfstorage.waitlist.service.WaitlistService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WaitlistController.class)
@AutoConfigureMockMvc(addFilters = false)
class WaitlistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WaitlistService waitlistService;

    @Test
    @DisplayName("POST /waitlists trả về 201 Created khi đăng ký vào danh sách chờ thành công")
    void testRegisterWaitlist() throws Exception {
        CreateWaitlistRequest request = CreateWaitlistRequest.builder()
                .facilityId(1L)
                .unitTypeId(7L)
                .targetStartDate(LocalDate.now().plusDays(5))
                .rentalMonths(3)
                .build();

        WaitlistResponse response = WaitlistResponse.builder()
                .id(101L)
                .customerId(15L)
                .facilityId(1L)
                .unitTypeId(7L)
                .targetStartDate(LocalDate.now().plusDays(5))
                .rentalMonths(3)
                .status(WaitlistStatus.WAITING)
                .createdAt(Instant.now())
                .build();

        when(waitlistService.registerWaitlist(any(), any())).thenReturn(response);

        mockMvc.perform(post("/waitlists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(101))
                .andExpect(jsonPath("$.data.status").value("WAITING"));
    }

    @Test
    @DisplayName("GET /waitlists/my trả về 200 OK với danh sách đơn chờ của tôi")
    void testGetMyWaitlists() throws Exception {
        WaitlistResponse response = WaitlistResponse.builder()
                .id(101L)
                .customerId(15L)
                .facilityId(1L)
                .unitTypeId(7L)
                .status(WaitlistStatus.WAITING)
                .build();

        when(waitlistService.getMyWaitlists(any())).thenReturn(List.of(response));

        mockMvc.perform(get("/waitlists/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(101));
    }
}
