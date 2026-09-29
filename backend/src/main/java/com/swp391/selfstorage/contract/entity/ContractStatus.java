package com.swp391.selfstorage.contract.entity;

public enum ContractStatus {
    PENDING_CHECK_IN, // Sinh sau thanh toan, cho khach den — BR-CHK-01
    ACTIVE,
    OVERDUE,
    PENDING_RETURN,
    RETURNED,
    CLOSED,           // Da quyet toan va tra kho hoan tat — BR-RET-04
    TERMINATED,       // Cham dut do qua han D+10 hoac tu choi nhan kho — BR-CHK-06, BR-OVD-07
    CANCELLED         // Huy truoc khi nhan kho hoac giai phong du lieu test
}
