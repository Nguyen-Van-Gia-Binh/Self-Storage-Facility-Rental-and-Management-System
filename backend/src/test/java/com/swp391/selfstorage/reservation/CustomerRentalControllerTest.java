package com.swp391.selfstorage.reservation;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.reservation.dto.CustomerRentalDetailResponse;
import com.swp391.selfstorage.reservation.dto.CustomerRentalSummaryResponse;
import com.swp391.selfstorage.reservation.service.CustomerRentalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CustomerRentalController.class)
@AutoConfigureMockMvc(addFilters = false)
class CustomerRentalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerRentalService customerRentalService;

    @Test
    @DisplayName("GET /customers/me/rentals trả về 200 OK kèm danh sách phân trang")
    void testGetMyRentals() throws Exception {
        CustomerRentalSummaryResponse item = new CustomerRentalSummaryResponse();
        item.setContractId(501L);
        item.setContractCode("HD-2026-0001");

        PageResponse<CustomerRentalSummaryResponse> page = new PageResponse<>(List.of(item), 0, 10, 1, 1);
        when(customerRentalService.getMyRentals(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/customers/me/rentals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].contractCode").value("HD-2026-0001"));
    }

    @Test
    @DisplayName("GET /customers/me/rentals/{id} trả về 200 OK kèm chi tiết")
    void testGetMyRentalDetail() throws Exception {
        CustomerRentalDetailResponse detail = new CustomerRentalDetailResponse();
        detail.setContractId(501L);
        detail.setContractCode("HD-2026-0001");

        when(customerRentalService.getMyRentalDetail(eq(501L), any())).thenReturn(detail);

        mockMvc.perform(get("/customers/me/rentals/501"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contractCode").value("HD-2026-0001"));
    }
}
