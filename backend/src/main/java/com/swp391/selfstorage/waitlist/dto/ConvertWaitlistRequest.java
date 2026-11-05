package com.swp391.selfstorage.waitlist.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConvertWaitlistRequest {

    /**
     * Ngày bắt đầu thuê thỏa thuận mới với khách (mặc định lấy targetStartDate của waitlist nếu hợp lệ)
     */
    @FutureOrPresent(message = "Ngày bắt đầu thuê phải từ hôm nay trở đi")
    private LocalDate startDate;

    /**
     * Số tháng thuê thỏa thuận mới (mặc định lấy rentalMonths của waitlist)
     */
    @Min(value = 1, message = "Số tháng thuê tối thiểu là 1 tháng")
    private Integer rentalMonths;
}
