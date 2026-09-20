package com.swp391.selfstorage.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // 400 Bad Request
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Dữ liệu yêu cầu không hợp lệ"),
    INVALID_START_DATE(HttpStatus.BAD_REQUEST, "Ngày bắt đầu thuê không được ở trong quá khứ"),
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
    UNIT_TYPE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy loại ô kho"),
    STORAGE_UNIT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho"),
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy đơn giữ chỗ"),
    CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"),

    // 409 Conflict
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email đã được sử dụng"),
    USERNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng"),
    UNIT_NOT_AVAILABLE(HttpStatus.CONFLICT, "Ô kho không còn khả dụng"),
    FACILITY_CODE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Mã cơ sở đã được sử dụng"),
    FACILITY_HAS_ACTIVE_CONTRACTS(HttpStatus.CONFLICT, "Không thể vô hiệu hóa cơ sở khi còn hợp đồng đang hoạt động"),
    UNIT_TYPE_CODE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Mã loại ô kho đã tồn tại"),
    UNIT_TYPE_HAS_ACTIVE_UNITS(HttpStatus.CONFLICT, "Không thể vô hiệu hóa loại kho đang có ô kho được thuê hoặc đặt chỗ"),
    STORAGE_UNIT_CODE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Mã ô kho đã tồn tại trong cơ sở"),
    STORAGE_UNIT_OCCUPIED(HttpStatus.CONFLICT, "Không thể thao tác trên ô kho đang có người thuê"),

    // 500 Internal Server Error
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String defaultMessage() {
        return defaultMessage;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
