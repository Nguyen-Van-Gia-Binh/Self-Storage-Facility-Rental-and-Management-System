package com.swp391.selfstorage.payment.event;

/** WS3 publish sau Payment COMPLETED — WS2 bat de tao Contract PENDING_CHECK_IN (T3.4). */
public record PaymentCompletedEvent(Long reservationId, Long paymentId) {}