package com.swp391.selfstorage.reservation.dto;

import com.swp391.selfstorage.reservation.entity.ReservationStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

/**
 * Tham số lọc danh sách đơn đặt chỗ phân trang (API-SPEC.md § 7.2).
 */
@Schema(description = "Tham số lọc danh sách đơn đặt chỗ")
public class ReservationFilterParams {

    @Schema(description = "Trang cần xem (bắt đầu từ 0)", example = "0")
    private int page = 0;

    @Schema(description = "Số bản ghi trên mỗi trang", example = "10")
    private int size = 10;

    @Schema(description = "Mã trạng thái đặt chỗ", example = "PENDING_PAYMENT")
    private ReservationStatus status;

    @Schema(description = "Lọc theo cơ sở", example = "1")
    private Long facilityId;

    @Schema(description = "Lọc theo khách hàng", example = "15")
    private Long customerId;

    @Schema(description = "Từ ngày bắt đầu thuê (yyyy-MM-dd)", example = "2026-10-01")
    private LocalDate startDateFrom;

    @Schema(description = "Đến ngày bắt đầu thuê (yyyy-MM-dd)", example = "2026-12-31")
    private LocalDate startDateTo;

    public ReservationFilterParams() {}

    // Explicit Getters and Setters
    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public Long getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Long facilityId) {
        this.facilityId = facilityId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public LocalDate getStartDateFrom() {
        return startDateFrom;
    }

    public void setStartDateFrom(LocalDate startDateFrom) {
        this.startDateFrom = startDateFrom;
    }

    public LocalDate getStartDateTo() {
        return startDateTo;
    }

    public void setStartDateTo(LocalDate startDateTo) {
        this.startDateTo = startDateTo;
    }
}
