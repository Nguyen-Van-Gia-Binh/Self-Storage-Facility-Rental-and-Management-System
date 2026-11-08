package com.swp391.selfstorage.common.config;

import com.swp391.selfstorage.common.dto.PageResponse;
import com.swp391.selfstorage.facility.controller.FacilityController;
import com.swp391.selfstorage.facility.service.FacilityService;
import com.swp391.selfstorage.payment.controller.PaymentController;
import com.swp391.selfstorage.payment.dto.PaymentResponse;
import com.swp391.selfstorage.payment.gateway.VnPayGateway;
import com.swp391.selfstorage.payment.service.PaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({FacilityController.class, PaymentController.class})
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FacilityService facilityService;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private VnPayGateway vnPayGateway;

    @Test
    @DisplayName("GET /facilities được phép truy cập ẩn danh (permitAll) mà không cần Token")
    void testPublicFacilitiesEndpointPermitAll() throws Exception {
        when(facilityService.getFacilities(any(), any(), any()))
                .thenReturn(new PageResponse<>());

        mockMvc.perform(get("/facilities"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /payments/vnpay/pay/{orderCode} được phép truy cập ẩn danh (permitAll) phục vụ chuyển hướng trình duyệt")
    void testVnpayPayEndpointPermitAll() throws Exception {
        when(paymentService.getPaymentByOrderCode(999L))
                .thenReturn(PaymentResponse.builder().status("PENDING").amount(500000L).transferContent("DH999").build());
        when(paymentService.requirePendingPayment(999L))
                .thenReturn(PaymentResponse.builder().status("PENDING").amount(500000L).transferContent("DH999").build());
        when(vnPayGateway.buildPayUrl(anyLong(), anyLong(), any(), any(), any()))
                .thenReturn("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?mock=1");

        mockMvc.perform(get("/payments/vnpay/pay/999").param("bankCode", "VNBANK"))
                .andExpect(status().isFound());
    }
}
