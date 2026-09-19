package com.swp391.selfstorage.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // 400 Bad Request
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Dữ liệu yêu cầu không hợp lệ"),
    INVALID_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "Chuyển trạng thái không hợp lệ"),
    RENEWAL_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "Hợp đồng không đủ điều kiện gia hạn"),

    // 401 Unauthorized
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Chưa xác thực hoặc token không hợp lệ"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn"),

    // 403 Forbidden
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "Không có quyền thực hiện hành động này"),
    FACILITY_ACCESS_DENIED(HttpStatus.FORBIDDEN, "Không có quyền truy cập cơ sở này"),

    // 404 Not Found
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"),
    FACILITY_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy cơ sở lưu trữ"),
    STORAGE_UNIT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho"),
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy đơn giữ chỗ"),
    CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"),

    // 409 Conflict
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email đã được sử dụng"),
    USERNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng"),
    UNIT_NOT_AVAILABLE(HttpStatus.CONFLICT, "Ô kho không còn khả dụng"),

    // 500 Internal Server Error
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }
}
