package com.swp391.selfstorage.contract.event;

import lombok.*;
import java.time.OffsetDateTime;

@Getter @AllArgsConstructor @Builder
public class ContractSettledEvent {
    private final Long contractId;
    private final Long customerId;
    private final Long facilityId;
    private final long depositRefundAmount;
    private final long payableAmount;
    private final OffsetDateTime settledAt;
}
