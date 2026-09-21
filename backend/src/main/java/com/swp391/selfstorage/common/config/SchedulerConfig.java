package com.swp391.selfstorage.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulerConfig {
    // Kích hoạt cơ chế chạy tác vụ theo lịch biểu (@Scheduled) trong toàn bộ ứng dụng Spring Boot
}
