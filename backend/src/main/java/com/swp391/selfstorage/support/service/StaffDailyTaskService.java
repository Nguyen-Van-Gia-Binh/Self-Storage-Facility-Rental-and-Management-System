package com.swp391.selfstorage.support.service;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.support.dto.StaffDailyTasksResponse;

import java.time.LocalDate;

public interface StaffDailyTaskService {

    /**
     * Lấy bảng công việc ca trực hằng ngày của nhân viên (FS-06, US-FS-06.1, UC-F5-05, API-SPEC § 12).
     *
     * @param staffId      ID nhân viên cần tra cứu
     * @param date         Ngày làm việc (mặc định LocalDate.now() nếu null)
     * @param pendingOnly  Chỉ lấy các nhiệm vụ còn tồn đọng / chưa hoàn tất
     * @param currentUser  Người dùng đang đăng nhập (Staff hoặc Facility Manager)
     * @return Bảng công việc 3 nhóm (Check-in, Return, Support) kèm thống kê ca trực
     */
    StaffDailyTasksResponse getDailyTasks(Long staffId, LocalDate date, Boolean pendingOnly, UserPrincipal currentUser);
}
