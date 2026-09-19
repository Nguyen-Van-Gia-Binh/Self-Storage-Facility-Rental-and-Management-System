package com.swp391.selfstorage.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private Instant timestamp = Instant.now();
    private int status;
    private String errorCode;
    private String message;
    private String path;
    private List<String> details;
    private T data;

    public ApiResponse(int status, String message, T data) {
        this.timestamp = Instant.now();
        this.status = status;
        this.message = message;
        this.data = data;
    }

    public ApiResponse(int status, String errorCode, String message, String path, List<String> details) {
        this.timestamp = Instant.now();
        this.status = status;
        this.errorCode = errorCode;
        this.message = message;
        this.path = path;
        this.details = details;
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(200, message, data);
    }

    public static <T> ApiResponse<T> error(int status, String errorCode, String message, String path, List<String> details) {
        return new ApiResponse<>(status, errorCode, message, path, details);
    }

    // Getters and Setters
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public List<String> getDetails() { return details; }
    public void setDetails(List<String> details) { this.details = details; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}
