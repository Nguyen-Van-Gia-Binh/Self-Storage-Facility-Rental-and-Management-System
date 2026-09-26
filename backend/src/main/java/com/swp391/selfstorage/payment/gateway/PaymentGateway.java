package com.swp391.selfstorage.payment.gateway;

import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutCommand;
import com.swp391.selfstorage.payment.gateway.dto.PaymentCheckoutResult;

public interface PaymentGateway {
    PaymentCheckoutResult createPayment(PaymentCheckoutCommand command);
}
