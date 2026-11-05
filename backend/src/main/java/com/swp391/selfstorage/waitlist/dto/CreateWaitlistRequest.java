package com.swp391.selfstorage.waitlist.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWaitlistRequest {

    @NotNull(message = "facilityId không được để trống")
    private Long facilityId;

    @NotNull(message = "unitTypeId không được để trống")
    private Long unitTypeId;

    @NotNull(message = "targetStartDate không được để trống")
    @FutureOrPresent(message = "Ngày mong muốn thuê phải từ ngày hôm nay trở đi")
    private LocalDate targetStartDate;

    @Min(value = 1, message = "Thời gian thuê tối thiểu 1 tháng")
    @Builder.Default
    private int rentalMonths = 1;
}
