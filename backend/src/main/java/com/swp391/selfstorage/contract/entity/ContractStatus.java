package com.swp391.selfstorage.contract.entity;

public enum ContractStatus {
    PENDING_CHECK_IN, // Sinh sau thanh toan, cho khach den — BR-CHK-01
    ACTIVE,
    OVERDUE,
    PENDING_RETURN,
    RETURNED,
    TERMINATED        // Cham dut hoac tu choi nhan kho — BR-CHK-06
}
