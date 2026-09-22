package com.swp391.selfstorage.report.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Loại báo cáo toàn hệ thống cần xuất file")
public enum ReportExportType {
    @Schema(description = "Báo cáo doanh thu toàn hệ thống theo kỳ và phân bổ cơ sở")
    REVENUE,

    @Schema(description = "Báo cáo tỷ lệ lấp đầy và trạng thái ô kho toàn hệ thống")
    OCCUPANCY,

    @Schema(description = "Báo cáo danh sách các hợp đồng đang nợ quá hạn")
    OVERDUE
}
