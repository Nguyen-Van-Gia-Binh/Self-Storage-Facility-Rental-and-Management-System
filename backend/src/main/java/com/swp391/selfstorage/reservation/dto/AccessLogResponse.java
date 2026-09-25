package com.swp391.selfstorage.reservation.dto;

import java.time.LocalDateTime;

public class AccessLogResponse {

    private String id;
    private String contractId;
    private String unitNumber;
    private String timestamp;
    private String method;
    private String accessorName;
    private String status;
    private String deviceInfo;

    public AccessLogResponse() {}

    public AccessLogResponse(Long id, Long contractId, String unitNumber, LocalDateTime accessedAt, String method, String accessorName, String status, String deviceInfo) {
        this.id = id != null ? String.valueOf(id) : "";
        this.contractId = contractId != null ? String.valueOf(contractId) : "";
        this.unitNumber = unitNumber;
        this.timestamp = accessedAt != null ? accessedAt.toString() : "";
        this.method = method;
        this.accessorName = accessorName;
        this.status = status;
        this.deviceInfo = deviceInfo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getUnitNumber() { return unitNumber; }
    public void setUnitNumber(String unitNumber) { this.unitNumber = unitNumber; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getAccessorName() { return accessorName; }
    public void setAccessorName(String accessorName) { this.accessorName = accessorName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }
}
