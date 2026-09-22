package com.swp391.selfstorage.report.util;

import com.swp391.selfstorage.auth.service.UserPrincipal;
import com.swp391.selfstorage.report.dto.FacilityOccupancyDetailDto;
import com.swp391.selfstorage.report.dto.FacilityRevenueShareDto;
import com.swp391.selfstorage.report.dto.OverdueContractDetailDto;
import com.swp391.selfstorage.report.dto.SystemOccupancyReportResponse;
import com.swp391.selfstorage.report.dto.SystemRevenueReportResponse;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class CsvReportExportUtil {

    private static final String CSV_BOM = "\uFEFF"; // UTF-8 BOM cho Excel
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private CsvReportExportUtil() {
        // Private constructor for utility class
    }

    /**
     * Xuất báo cáo Doanh thu toàn hệ thống dạng CSV (BM-05, US-BM-05.1)
     */
    public static byte[] exportRevenueReport(SystemRevenueReportResponse report, UserPrincipal currentUser) {
        StringBuilder sb = new StringBuilder(CSV_BOM);

        // 1. Metadata Header (AC-2)
        appendMetadataHeader(sb, "BÁO CÁO DOANH THU TOÀN HỆ THỐNG",
                report.getFrom() + " đến " + report.getTo(), currentUser);

        // 2. Summary Section
        sb.append("TỔNG QUAN DOANH THU\n");
        sb.append("Tổng doanh thu,").append(report.getTotalRevenue()).append("\n");
        sb.append("Doanh thu tiền thuê,").append(report.getRentalRevenue()).append("\n");
        sb.append("Doanh thu phụ phí,").append(report.getSurchargeRevenue()).append("\n");
        sb.append("Doanh thu phạt quá hạn,").append(report.getOverdueFeeRevenue()).append("\n\n");

        // 3. Detail by Facility
        sb.append("PHÂN BỔ THEO CƠ SỞ\n");
        sb.append("Mã cơ sở,Tên cơ sở,Doanh thu (VND)\n");

        List<FacilityRevenueShareDto> list = report.getByFacility();
        if (list == null || list.isEmpty()) {
            sb.append("# Không có dữ liệu trong kỳ báo cáo\n");
        } else {
            for (FacilityRevenueShareDto f : list) {
                sb.append(f.getFacilityId()).append(",")
                        .append(escapeCsv(f.getFacilityName())).append(",")
                        .append(f.getRevenue()).append("\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Xuất báo cáo Tỷ lệ lấp đầy toàn hệ thống dạng CSV (BM-05, US-BM-05.1)
     */
    public static byte[] exportOccupancyReport(SystemOccupancyReportResponse report, UserPrincipal currentUser) {
        StringBuilder sb = new StringBuilder(CSV_BOM);

        appendMetadataHeader(sb, "BÁO CÁO TỶ LỆ LẤP ĐẦY TOÀN HỆ THỐNG", "Hiện tại", currentUser);

        sb.append("TỔNG QUAN HỆ THỐNG\n");
        sb.append("Tỷ lệ lấp đầy toàn quốc,").append(String.format("%.1f%%", report.getOverallOccupancyRate() * 100))
                .append("\n");
        sb.append("Tổng số ô kho,").append(report.getTotalUnits()).append("\n");
        sb.append("Số ô đang thuê (Occupied),").append(report.getTotalOccupiedUnits()).append("\n");
        sb.append("Số ô còn trống (Available),").append(report.getTotalAvailableUnits()).append("\n\n");

        sb.append("CHI TIẾT THEO CƠ SỞ (SẮP XẾP THEO TỶ LỆ LẤP ĐẦY GIẢM DẦN)\n");
        sb.append("Mã cơ sở,Tên cơ sở,Tổng ô,Trống,Đang thuê,Vệ sinh,Bảo trì,Hỏng,HĐ quá hạn,Tỷ lệ lấp đầy\n");

        List<FacilityOccupancyDetailDto> list = report.getFacilities();
        if (list == null || list.isEmpty()) {
            sb.append("# Không có dữ liệu trong kỳ báo cáo\n");
        } else {
            for (FacilityOccupancyDetailDto f : list) {
                sb.append(f.getFacilityId()).append(",")
                        .append(escapeCsv(f.getFacilityName())).append(",")
                        .append(f.getTotalUnits()).append(",")
                        .append(f.getAvailableUnits()).append(",")
                        .append(f.getOccupiedUnits()).append(",")
                        .append(f.getCleaningUnits()).append(",")
                        .append(f.getMaintenanceUnits()).append(",")
                        .append(f.getOutOfServiceUnits()).append(",")
                        .append(f.getOverdueContractsCount()).append(",")
                        .append(String.format("%.1f%%", f.getOccupancyRate() * 100)).append("\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Xuất báo cáo Danh sách Hợp đồng quá hạn dạng CSV (BM-05, US-BM-05.1)
     */
    public static byte[] exportOverdueReport(List<OverdueContractDetailDto> overdueContracts,
            UserPrincipal currentUser) {
        StringBuilder sb = new StringBuilder(CSV_BOM);

        appendMetadataHeader(sb, "BÁO CÁO DANH SÁCH HỢP ĐỒNG NỢ QUÁ HẠN", "Hiện tại", currentUser);

        sb.append(
                "Mã HĐ,Khách hàng,Số điện thoại,Email,Cơ sở,Ô kho,Ngày hết hạn,Số ngày trễ,Giá thuê/tháng,Tiền phạt tích lũy,Tổng công nợ,Trạng thái\n");

        if (overdueContracts == null || overdueContracts.isEmpty()) {
            sb.append("# Không có dữ liệu trong kỳ báo cáo\n");
        } else {
            for (OverdueContractDetailDto c : overdueContracts) {
                sb.append(escapeCsv(c.getContractCode())).append(",")
                        .append(escapeCsv(c.getCustomerName())).append(",")
                        .append(escapeCsv(c.getCustomerPhone())).append(",")
                        .append(escapeCsv(c.getCustomerEmail())).append(",")
                        .append(escapeCsv(c.getFacilityName())).append(",")
                        .append(escapeCsv(c.getUnitCode())).append(",")
                        .append(c.getEndDateExclusive() != null ? c.getEndDateExclusive().toString() : "").append(",")
                        .append(c.getOverdueDays()).append(",")
                        .append(c.getMonthlyPrice()).append(",")
                        .append(c.getAccruedOverdueFee()).append(",")
                        .append(c.getTotalOutstandingDebt()).append(",")
                        .append(c.getStatus() != null ? c.getStatus().name() : "").append("\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static void appendMetadataHeader(StringBuilder sb, String reportName, String period,
            UserPrincipal currentUser) {
        sb.append("# ").append(reportName).append("\n");
        sb.append("# Kỳ báo cáo: ").append(period).append("\n");
        String exporter = (currentUser != null) ? currentUser.getFullName() + " (" + currentUser.getUsername() + ")"
                : "Hệ thống";

        sb.append("# Người xuất: ").append(exporter).append("\n");
        sb.append("# Thời điểm xuất: ").append(LocalDateTime.now(VN_ZONE).format(TIME_FORMATTER))
                .append(" (Asia/Ho_Chi_Minh)\n\n");
    }

    private static String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
