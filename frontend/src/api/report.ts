import { apiClient } from './client';
import type { ApiResponse } from './client';
import type {
  SystemRevenueReport,
  SystemOccupancyReport,
  OverdueReportResponse,
  ReportFilterParams,
  ReportExportParams,
} from '../types';
function asMoney(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Backend ApiResponse dùng `status` + `data` (không có `success`).
 * Cũng chấp nhận payload đã là body thuần hoặc mock có `success`.
 */
function unwrapReportPayload<T extends object>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res) {
    const envelope = res as { data?: unknown; success?: boolean; status?: number };
    if (envelope.data && typeof envelope.data === 'object') {
      return envelope.data as T;
    }
  }
  return res as T;
}

function normalizeRevenueReport(raw: {
  from?: string;
  to?: string;
  totalRevenue?: unknown;
  rentalRevenue?: unknown;
  surchargeRevenue?: unknown;
  overdueFeeRevenue?: unknown;
  renewalRevenue?: unknown;
  depositBalance?: unknown;
  totalRefundAmount?: unknown;
  byFacility?: Array<Record<string, unknown>>;
}): SystemRevenueReport {
  const facilities = Array.isArray(raw?.byFacility) ? raw.byFacility : [];
  return {
    from: raw?.from || '',
    to: raw?.to || '',
    totalRevenue: asMoney(raw?.totalRevenue),
    rentalRevenue: asMoney(raw?.rentalRevenue),
    surchargeRevenue: asMoney(raw?.surchargeRevenue),
    overdueFeeRevenue: asMoney(raw?.overdueFeeRevenue),
    renewalRevenue: asMoney(raw?.renewalRevenue),
    depositBalance: asMoney(raw?.depositBalance),
    totalRefundAmount: asMoney(raw?.totalRefundAmount),
    byFacility: facilities.map((facility) => {
      const rentalRevenue = asMoney(facility.rentalRevenue);
      const surchargeRevenue = asMoney(facility.surchargeRevenue);
      const overdueFeeRevenue = asMoney(facility.overdueFeeRevenue);
      const renewalRevenue = asMoney(facility.renewalRevenue);
      const totalRevenue = asMoney(facility.totalRevenue ?? facility.revenue)
        || rentalRevenue + surchargeRevenue + overdueFeeRevenue + renewalRevenue;
      return {
        facilityId: Number(facility.facilityId),
        facilityName: String(facility.facilityName || ''),
        totalRevenue,
        rentalRevenue,
        surchargeRevenue,
        overdueFeeRevenue,
        renewalRevenue,
        depositBalance: asMoney(facility.depositBalance),
        refundAmount: asMoney(facility.refundAmount),
      };
    }),
  };
}

function normalizeOccupancyReport(raw: SystemOccupancyReport & {
  facilities?: SystemOccupancyReport['data'];
  overallOccupancyRate?: number;
  totalUnits?: number;
  totalOccupiedUnits?: number;
  totalAvailableUnits?: number;
}, month?: string): SystemOccupancyReport {
  const rowsCandidate = raw?.data ?? raw?.facilities;
  const rows = Array.isArray(rowsCandidate) ? rowsCandidate : [];
  return {
    month: raw?.month || month || '',
    averageOccupancyRate: asMoney(raw?.averageOccupancyRate ?? raw?.overallOccupancyRate),
    totalUnitsSystem: asMoney(raw?.totalUnitsSystem ?? raw?.totalUnits),
    occupiedUnitsSystem: asMoney(raw?.occupiedUnitsSystem ?? raw?.totalOccupiedUnits),
    availableUnitsSystem: asMoney(raw?.availableUnitsSystem ?? raw?.totalAvailableUnits),
    data: rows.map((item) => ({
      ...item,
      occupancyRate: asMoney(item.occupancyRate),
      availableUnits: asMoney(item.availableUnits),
      reservedUnits: asMoney(item.reservedUnits),
      occupiedUnits: asMoney(item.occupiedUnits),
      cleaningUnits: asMoney(item.cleaningUnits),
      maintenanceUnits: asMoney(item.maintenanceUnits),
      outOfServiceUnits: asMoney(item.outOfServiceUnits),
      totalUnits: asMoney(item.totalUnits),
      overdueContractsCount: asMoney(item.overdueContractsCount),
    })),
  };
}

/**
 * Lấy báo cáo doanh thu toàn hệ thống — BM-04, US-BM-04.1
 * GET /api/v1/reports/system/revenue
 */
export async function getSystemRevenueReport(params: ReportFilterParams): Promise<SystemRevenueReport> {
  const query = new URLSearchParams();
  if (params.from) query.append('from', params.from);
  if (params.to) query.append('to', params.to);
  // Chỉ gửi facilityId khi là số hợp lệ; "all"/undefined = toàn hệ thống (BM-04)
  if (params.facilityId != null && Number.isFinite(params.facilityId)) {
    query.append('facilityId', String(params.facilityId));
  }

  const res = await apiClient<ApiResponse<SystemRevenueReport> | SystemRevenueReport>(
    `/reports/system/revenue?${query.toString()}`
  );
  return normalizeRevenueReport(unwrapReportPayload(res));
}

/**
 * Lấy báo cáo tỷ lệ lấp đầy theo thời gian — BM-04, US-BM-04.2
 * GET /api/v1/reports/system/occupancy
 */
export async function getSystemOccupancyReport(
  month?: string,
  facilityId?: number
): Promise<SystemOccupancyReport> {
  const query = new URLSearchParams();
  if (month) query.append('month', month);
  if (facilityId != null && Number.isFinite(facilityId)) {
    query.append('facilityId', String(facilityId));
  }

  const res = await apiClient<ApiResponse<SystemOccupancyReport> | SystemOccupancyReport>(
    `/reports/system/occupancy?${query.toString()}`
  );
  return normalizeOccupancyReport(unwrapReportPayload(res), month);
}

/**
 * Lấy báo cáo danh sách hợp đồng quá hạn — BM-05, API-SPEC § 12
 * GET /api/v1/reports/system/overdue
 */
export async function getSystemOverdueReport(facilityId?: number): Promise<OverdueReportResponse> {
  const query = new URLSearchParams({ page: '0', size: '200' });
  if (facilityId != null && Number.isFinite(facilityId)) {
    query.append('facilityId', String(facilityId));
  }

  const res = await apiClient<ApiResponse<OverdueReportResponse & { totalElements?: number }> | (OverdueReportResponse & { totalElements?: number })>(
    `/reports/system/overdue?${query.toString()}`
  );
  const page = unwrapReportPayload<OverdueReportResponse & { totalElements?: number }>(res);
  const content = Array.isArray(page.content) ? page.content : [];
  return {
    totalOverdueContracts: page.totalOverdueContracts ?? page.totalElements ?? content.length,
    totalAccruedFee: page.totalAccruedFee ?? content.reduce((sum, item) => sum + (item.accruedOverdueFee || 0), 0),
    content,
  };
}

/**
 * Trích xuất file báo cáo tổng hợp hệ thống — BM-05, US-BM-05.1
 * GET /api/v1/reports/system/export
 */
export async function exportSystemReport(params: ReportExportParams): Promise<Blob> {
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
}
