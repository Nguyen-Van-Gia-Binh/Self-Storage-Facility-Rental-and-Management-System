package com.swp391.selfstorage.reservation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "access_log")
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "storage_unit_id")
    private Long storageUnitId;

    @Column(name = "accessed_at", nullable = false)
    private LocalDateTime accessedAt = LocalDateTime.now();

    @Column(name = "method", nullable = false, length = 30)
    private String method; // PIN_CODE, QR_PASS, STAFF_OVERRIDE

    @Column(name = "accessor_name", nullable = false, length = 100)
    private String accessorName;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // SUCCESS, FAILED

    @Column(name = "device_info", length = 200)
    private String deviceInfo;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AccessLog() {}

    public AccessLog(Long contractId, Long storageUnitId, String method, String accessorName, String status, String deviceInfo) {
        this.contractId = contractId;
        this.storageUnitId = storageUnitId;
        this.method = method;
        this.accessorName = accessorName;
        this.status = status;
        this.deviceInfo = deviceInfo;
        this.accessedAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getContractId() { return contractId; }
    public void setContractId(Long contractId) { this.contractId = contractId; }

    public Long getStorageUnitId() { return storageUnitId; }
    public void setStorageUnitId(Long storageUnitId) { this.storageUnitId = storageUnitId; }

    public LocalDateTime getAccessedAt() { return accessedAt; }
    public void setAccessedAt(LocalDateTime accessedAt) { this.accessedAt = accessedAt; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getAccessorName() { return accessorName; }
    public void setAccessorName(String accessorName) { this.accessorName = accessorName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
