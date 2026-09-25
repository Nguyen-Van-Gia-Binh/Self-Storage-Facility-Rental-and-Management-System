package com.swp391.selfstorage.reservation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

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

@WebMvcTest(CustomerRentalController.class)
@AutoConfigureMockMvc(addFilters = false)
class CustomerRentalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerRentalService customerRentalService;

    @Test
    @DisplayName("GET /customers/me/rentals - Trả về danh sách hợp đồng kho thuê của khách hàng")
    void testGetMyRentals_Success() throws Exception {
        CustomerRentalSummaryResponse summary = new CustomerRentalSummaryResponse();
        summary.setContractId(1L);
        summary.setContractCode("CTR-202610-0001");
        summary.setStatus("ACTIVE");

        PageResponse<CustomerRentalSummaryResponse> page = new PageResponse<>(
                List.of(summary), 0, 10, 1L, 1);

        when(customerRentalService.getMyRentals(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/customers/me/rentals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.content[0].contractId").value(1))
                .andExpect(jsonPath("$.data.content[0].contractCode").value("CTR-202610-0001"));
    }

    @Test
    @DisplayName("GET /customers/me/rentals/{id} - Trả về chi tiết hợp đồng thuê")
    void testGetMyRentalDetail_Success() throws Exception {
        CustomerRentalDetailResponse detail = new CustomerRentalDetailResponse();
        detail.setContractId(1L);
        detail.setContractCode("CTR-202610-0001");

        when(customerRentalService.getMyRentalDetail(eq(1L), any())).thenReturn(detail);

        mockMvc.perform(get("/customers/me/rentals/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.contractId").value(1));
    }
}
