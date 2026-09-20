import { apiClient } from './client';
import type { ApiResponse } from './client';
import type {
  SystemRevenueReport,
  SystemOccupancyReport,
  OverdueReportResponse,
  ReportFilterParams,
  ReportExportParams,
} from '../types';
import mockData from '../mock/mock-system-reports.json';
import { generateCsvFromData } from '../utils/format';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * Lấy báo cáo doanh thu toàn hệ thống — BM-04, US-BM-04.1
 * GET /api/v1/reports/system/revenue
 */
export async function getSystemRevenueReport(params: ReportFilterParams): Promise<SystemRevenueReport> {
  if (USE_MOCK) {
    const raw = JSON.parse(JSON.stringify(mockData.revenue)) as SystemRevenueReport;
    raw.from = params.from;
    raw.to = params.to;

    if (params.facilityId) {
      const facility = raw.byFacility.find((f) => f.facilityId === params.facilityId);
      if (facility) {
        return {
          from: params.from,
          to: params.to,
          totalRevenue: facility.totalRevenue,
          rentalRevenue: facility.rentalRevenue,
          surchargeRevenue: facility.surchargeRevenue,
          overdueFeeRevenue: facility.overdueFeeRevenue,
          renewalRevenue: facility.renewalRevenue,
          depositBalance: facility.depositBalance,
          totalRefundAmount: facility.refundAmount,
          byFacility: [facility],
        };
      }
    }
    return raw;
  }

  try {
    const query = new URLSearchParams();
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.facilityId) query.append('facilityId', String(params.facilityId));

    const res = await apiClient<ApiResponse<SystemRevenueReport> | SystemRevenueReport>(
      `/reports/system/revenue?${query.toString()}`
    );
    if ('success' in res && res.data) {
      return res.data;
    }
    return res as SystemRevenueReport;
  } catch (error) {
    console.warn('Lỗi gọi API /reports/system/revenue, fallback sang mock data:', error);
    return JSON.parse(JSON.stringify(mockData.revenue));
  }
}

/**
 * Lấy báo cáo tỷ lệ lấp đầy theo thời gian — BM-04, US-BM-04.2
 * GET /api/v1/reports/system/occupancy
 */
export async function getSystemOccupancyReport(
  month?: string,
  facilityId?: number
): Promise<SystemOccupancyReport> {
  if (USE_MOCK) {
    const raw = JSON.parse(JSON.stringify(mockData.occupancy)) as SystemOccupancyReport;
    if (month) raw.month = month;
    if (facilityId) {
      raw.data = raw.data.filter((d) => d.facilityId === facilityId);
      if (raw.data.length > 0) {
        raw.averageOccupancyRate = raw.data[0].occupancyRate;
        raw.totalUnitsSystem = raw.data[0].totalUnits;
        raw.occupiedUnitsSystem = raw.data[0].occupiedUnits;
        raw.availableUnitsSystem = raw.data[0].availableUnits;
      }
    }
    return raw;
  }

  try {
    const query = new URLSearchParams();
    if (month) query.append('month', month);
    if (facilityId) query.append('facilityId', String(facilityId));

    const res = await apiClient<ApiResponse<SystemOccupancyReport> | SystemOccupancyReport>(
      `/reports/system/occupancy?${query.toString()}`
    );
    if ('success' in res && res.data) {
      return res.data;
    }
    return res as SystemOccupancyReport;
  } catch (error) {
    console.warn('Lỗi gọi API /reports/system/occupancy, fallback sang mock data:', error);
    return JSON.parse(JSON.stringify(mockData.occupancy));
  }
}

/**
 * Lấy báo cáo danh sách hợp đồng quá hạn — BM-05, API-SPEC § 12
 * GET /api/v1/reports/system/overdue
 */
export async function getSystemOverdueReport(facilityId?: number): Promise<OverdueReportResponse> {
  if (USE_MOCK) {
    const raw = JSON.parse(JSON.stringify(mockData.overdue)) as OverdueReportResponse;
    if (facilityId) {
      raw.content = raw.content.filter((c) => c.facilityId === facilityId);
      raw.totalOverdueContracts = raw.content.length;
      raw.totalAccruedFee = raw.content.reduce((acc, c) => acc + c.accruedOverdueFee, 0);
    }
    return raw;
  }

  try {
    const query = new URLSearchParams();
    if (facilityId) query.append('facilityId', String(facilityId));

    const res = await apiClient<ApiResponse<OverdueReportResponse> | OverdueReportResponse>(
      `/reports/system/overdue?${query.toString()}`
    );
    if ('success' in res && res.data) {
      return res.data;
    }
    return res as OverdueReportResponse;
  } catch (error) {
    console.warn('Lỗi gọi API /reports/system/overdue, fallback sang mock data:', error);
    return JSON.parse(JSON.stringify(mockData.overdue));
  }
}

/**
 * Trích xuất file báo cáo tổng hợp hệ thống — BM-05, US-BM-05.1
 * GET /api/v1/reports/system/export
 */
export async function exportSystemReport(params: ReportExportParams): Promise<Blob> {
  if (USE_MOCK) {
    // Giả lập tạo file CSV/XLSX từ dữ liệu mock có sẵn
    if (params.type === 'REVENUE') {
      const headers = ['Mã Cơ Sở', 'Tên Cơ Sở', 'Tiền Thuê Kho', 'Phụ Phí', 'Gia Hạn', 'Phạt Quá Hạn', 'Tổng Doanh Thu (VNĐ)'];
      const rows = mockData.revenue.byFacility.map((f) => [
        f.facilityId,
        f.facilityName,
        f.rentalRevenue,
        f.surchargeRevenue,
        f.renewalRevenue,
        f.overdueFeeRevenue,
        f.totalRevenue,
      ]);
      return generateCsvFromData(headers, rows);
    }

    if (params.type === 'OCCUPANCY') {
      const headers = ['Mã Cơ Sở', 'Tên Cơ Sở', 'Tổng Ô', 'Đang Thuê', 'Còn Trống', 'Đặt Chỗ', 'Bảo Trì', 'Tỷ Lệ Lấp Đầy'];
      const rows = mockData.occupancy.data.map((o) => [
        o.facilityId,
        o.facilityName,
        o.totalUnits,
        o.occupiedUnits,
        o.availableUnits,
        o.reservedUnits,
        o.maintenanceUnits,
        `${(o.occupancyRate * 100).toFixed(1)}%`,
      ]);
      return generateCsvFromData(headers, rows);
    }

    // OVERDUE
    const headers = ['Mã Hợp Đồng', 'Khách Hàng', 'Số Điện Thoại', 'Ô Kho', 'Cơ Sở', 'Số Ngày Quá Hạn', 'Nợ Phạt Tích Lũy (VNĐ)'];
    const rows = mockData.overdue.content.map((c) => [
      c.contractCode,
      c.customerName,
      c.customerPhone,
      c.unitCode,
      c.facilityName,
      c.overdueDays,
      c.accruedOverdueFee,
    ]);
    return generateCsvFromData(headers, rows);
  }

  try {
    const query = new URLSearchParams({
      type: params.type,
      from: params.from,
      to: params.to,
      format: params.format,
    });
    if (params.facilityId) query.append('facilityId', String(params.facilityId));

    const response = await fetch(`/api/v1/reports/system/export?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Export API error: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.warn('Lỗi gọi API export, fallback sang client generation:', error);
    const headers = ['Loại Báo Cáo', 'Kỳ', 'Định Dạng'];
    const rows = [[params.type, `${params.from} đến ${params.to}`, params.format]];
    return generateCsvFromData(headers, rows);
  }
}
