package com.swp391.selfstorage.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // 400 Bad Request
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Dữ liệu yêu cầu không hợp lệ"),
    INVALID_START_DATE(HttpStatus.BAD_REQUEST, "Ngày bắt đầu thuê không được ở trong quá khứ"),
    INVALID_STATUS_TRANSITION(HttpStatus.BAD_REQUEST, "Chuyển trạng thái không hợp lệ"),
    RENEWAL_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "Hợp đồng không đủ điều kiện gia hạn"),
    ROLE_REQUIRES_FACILITY(HttpStatus.BAD_REQUEST,
            "Vai trò Nhân viên hoặc Quản lý yêu cầu phải gán ít nhất một cơ sở làm việc"),
    RENEWAL_MONTHS_INVALID(HttpStatus.BAD_REQUEST, "Số tháng gia hạn không nằm trong giới hạn chính sách"),

    // 401 Unauthorized
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Chưa xác thực hoặc token không hợp lệ"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Refresh token đã hết hạn hoặc không hợp lệ"),

    // 403 Forbidden
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "Không có quyền thực hiện hành động này"),
    ACCOUNT_DISABLED(HttpStatus.FORBIDDEN, "Tài khoản của bạn đã bị vô hiệu hóa"),
    FACILITY_ACCESS_DENIED(HttpStatus.FORBIDDEN, "Không có quyền truy cập cơ sở này"),
    CONTRACT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "Hợp đồng này không thuộc cơ sở bạn phụ trách"),

    // 404 Not Found
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"),
    FACILITY_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy cơ sở lưu trữ"),
    UNIT_TYPE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy loại ô kho"),
    STORAGE_UNIT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho"),
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy đơn giữ chỗ"),
    CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"),
    RETURN_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu trả kho"),
    SURCHARGE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy phụ phí"),
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy thanh toán"),
    POLICY_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy phiên bản chính sách"),
    SUPPORT_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu hỗ trợ"),

    // 409 Conflict
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email đã được sử dụng"),
    USERNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "Tên đăng nhập đã được sử dụng"),
    UNIT_NOT_AVAILABLE(HttpStatus.CONFLICT, "Ô kho không còn khả dụng"),
    FACILITY_CODE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Mã cơ sở đã được sử dụng"),
    FACILITY_HAS_ACTIVE_CONTRACTS(HttpStatus.CONFLICT, "Không thể vô hiệu hóa cơ sở khi còn hợp đồng đang hoạt động"),
    UNIT_TYPE_CODE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Mã loại ô kho đã tồn tại"),
    UNIT_TYPE_HAS_ACTIVE_UNITS(HttpStatus.CONFLICT,
            "Không thể vô hiệu hóa loại kho đang có ô kho được thuê hoặc đặt chỗ"),
    STORAGE_UNIT_CODE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Mã ô kho đã tồn tại trong cơ sở"),
    STORAGE_UNIT_OCCUPIED(HttpStatus.CONFLICT, "Không thể thao tác trên ô kho đang có người thuê"),
    UNIT_ASSIGNMENT_FAILED(HttpStatus.CONFLICT, "Ô kho đã bị chiếm bởi giao dịch đồng thời, vui lòng thử lại"),
    RESERVATION_EXPIRED(HttpStatus.CONFLICT, "Đơn đặt chỗ đã hết thời gian giữ chỗ 48h"),
    RESERVATION_ALREADY_FULFILLED(HttpStatus.CONFLICT, "Đơn đặt chỗ đã được check-in thành công"),
    CONTRACT_NOT_PENDING_CHECKIN(HttpStatus.CONFLICT, "Hợp đồng không ở trạng thái chờ nhận kho"),
    CONTRACT_NOT_ACTIVE_OR_OVERDUE(HttpStatus.CONFLICT,
            "Hợp đồng phải ở trạng thái đang hoạt động hoặc quá hạn để trả kho"),
    CONTRACT_NOT_PENDING_RETURN(HttpStatus.CONFLICT, "Hợp đồng chưa ở trạng thái chờ duyệt trả kho"),
    SURCHARGE_CODE_ALREADY_EXISTS(HttpStatus.CONFLICT, "Mã phụ phí đã tồn tại"),
    PAYMENT_FAILED(HttpStatus.CONFLICT, "Thanh toán thất bại ở cổng thanh toán"),
    POLICY_VERSION_ALREADY_EXISTS(HttpStatus.CONFLICT, "Số phiên bản chính sách đã tồn tại"),
    CAPACITY_NOT_AVAILABLE(HttpStatus.CONFLICT, "Không còn sức chứa khả dụng cho loại ô kho này trong khoảng thời gian đã chọn"),
    CONTRACT_OVERDUE(HttpStatus.CONFLICT, "Bạn có hợp đồng đang quá hạn, vui lòng giải quyết trước khi tạo đơn đặt chỗ mới"),
    RESERVATION_ALREADY_CANCELLED(HttpStatus.CONFLICT, "Đơn đặt chỗ đã được hủy trước đó"),
    SUPPORT_REQUEST_CANNOT_BE_CANCELLED(HttpStatus.CONFLICT, "Chỉ có thể hủy yêu cầu hỗ trợ khi ở trạng thái Mới"),
    SUPPORT_REQUEST_ALREADY_CLOSED(HttpStatus.CONFLICT, "Yêu cầu hỗ trợ đã kết thúc"),
    SUPPORT_REQUEST_NOT_RESOLVED(HttpStatus.CONFLICT, "Yêu cầu hỗ trợ chưa được xử lý xong để xác nhận"),

    // 422 Unprocessable Entity
    RETURN_NOTICE_TOO_SHORT(HttpStatus.UNPROCESSABLE_ENTITY,
            "Thời gian hẹn trả kho không hợp lệ theo quy định báo trước"),
    AMOUNT_MISMATCH(HttpStatus.UNPROCESSABLE_ENTITY, "Số tiền không khớp với tổng phải trả"),

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
