package com.swp391.selfstorage.user.entity;

/**
 * Vai trò người dùng trong hệ thống (SA-02, TOPIC.md § 2, V1__init_schema.sql).
 * Khớp với CHECK constraint ck_app_user_role trong database SQL Server.
 */
public enum UserRole {
    STORAGE_CUSTOMER("Khách thuê kho"),
    FACILITY_STAFF("Nhân viên cơ sở"),
    FACILITY_MANAGER("Quản lý cơ sở"),
    BUSINESS_OPERATIONS_MANAGER("Quản lý vận hành kinh doanh"),
    SYSTEM_ADMINISTRATOR("Quản trị viên hệ thống");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
