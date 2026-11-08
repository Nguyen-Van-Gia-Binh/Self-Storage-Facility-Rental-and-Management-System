package com.swp391.selfstorage.payment.entity;

import com.swp391.selfstorage.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "payment_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reservation_id")
    private Long reservationId;

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;

    @Column(name = "provider_reference", length = 100)
    private String providerReference;

    @Column(name = "order_code", unique = true)
    private Long orderCode;

    /** Số tháng gia hạn đã chốt lúc tạo checkout. Chỉ có với CONTRACT_RENEWAL. */
    @Column(name = "renewal_months")
    private Integer renewalMonths;

    /** Ngày bắt đầu mới khi khách dời lịch nhận kho (RESCHEDULE_FEE). */
    @Column(name = "rescheduled_start_date")
    private LocalDate rescheduledStartDate;
}
