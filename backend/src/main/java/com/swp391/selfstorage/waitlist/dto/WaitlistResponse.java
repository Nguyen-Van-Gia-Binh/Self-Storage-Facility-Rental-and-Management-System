package com.swp391.selfstorage.waitlist.dto;

import com.swp391.selfstorage.waitlist.entity.WaitlistStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaitlistResponse {

    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private String contactPhone;
    private String customerEmail;

    private Long facilityId;
    private String facilityName;

    private Long unitTypeId;
    private String unitTypeCode;
    private String unitTypeName;

    private LocalDate targetStartDate;
    private int rentalMonths;

    private WaitlistStatus status;

    private Long assignedFmId;
    private String assignedFmName;

    private OffsetDateTime lastContactedAt;
    private OffsetDateTime contactTimeoutAt;
    private String contactNotes;

    private Long convertedReservationId;
    private String convertedReservationCode;
    private Long convertedContractId;

    /**
     * Số ô kho còn trống hiện tại của Hạng kho này tại Cơ sở (Available Capacity Badge cho FM CRM)
     */
    private Long availableCapacity;

    /**
     * Số đơn đặt chỗ trước của khách chưa được gán ô kho (dùng để chặn phân bổ Waitlist sai quy chế ưu tiên)
     */
    private Long unassignedReservationCount;

    /**
     * Số giây còn lại của thời gian khóa độc quyền tư vấn (dùng cho Countdown Timer trên giao diện FM)
     */
    private Long remainingTimeoutSeconds;

    private Instant createdAt;
    private Instant updatedAt;
}
