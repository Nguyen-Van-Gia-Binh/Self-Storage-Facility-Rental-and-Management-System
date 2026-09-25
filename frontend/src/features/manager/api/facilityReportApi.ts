// frontend/src/features/manager/api/facilityReportApi.ts

import { apiClient, isMockEnabled } from '@/api/client';
import type { ApiResponse } from '@/api/client';
import type {
  FacilityOverviewReport,
  OverdueDebtReport,
  FacilityContractSummary,
  FacilityInfo,
} from '../types/report';
import {
  mockFacilities,
  mockOverviewReportFAC1,
  mockOverviewReportFAC2,
  mockOverdueReportFAC1,
  mockFacilityContractsFAC1,
} from '../mock/mockFacilityReportData';


/**
 * 1. Lấy báo cáo tổng quan vận hành cơ sở (FM-06, US-FM-06.1 AC-1, AC-2, AC-3)
 * Endpoint: GET /api/v1/reports/facility/{facilityId}/overview?month=YYYY-MM
 */
export async function getFacilityOverviewReport(
  facilityId: number,
  month?: string
): Promise<FacilityOverviewReport> {
  if (isMockEnabled('WS4')) {
    const baseMock = facilityId === 2 ? mockOverviewReportFAC2 : mockOverviewReportFAC1;
    return {
      ...baseMock,
      month: month || baseMock.month,
    };
  }

  try {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const res = await apiClient<ApiResponse<FacilityOverviewReport>>(
      `/reports/facility/${facilityId}/overview${query}`
    );
    if (res && res.data) {
      return res.data;
    }
    return facilityId === 2 ? mockOverviewReportFAC2 : mockOverviewReportFAC1;
  } catch (error) {
    console.warn('Lỗi gọi API /reports/facility/{id}/overview, fallback mock:', error);
    const baseMock = facilityId === 2 ? mockOverviewReportFAC2 : mockOverviewReportFAC1;
    return {
      ...baseMock,
      month: month || baseMock.month,
    };
  }
}

/**
 * 2. Lấy báo cáo rủi ro nợ quá hạn theo 3 độ tuổi nợ D+1..D+10, D+11..D+30, >D+30 (FM-06, US-FM-06.1 AC-4)
 * Endpoint: GET /api/v1/reports/facility/{facilityId}/overdue-debt
 */
export async function getFacilityOverdueDebtReport(
  facilityId: number
): Promise<OverdueDebtReport> {
  if (isMockEnabled('WS4')) {
    return {
      ...mockOverdueReportFAC1,
      facilityId,
    };
  }

  try {
    const res = await apiClient<ApiResponse<OverdueDebtReport>>(
      `/reports/facility/${facilityId}/overdue-debt`
    );
    if (res && res.data) {
      return res.data;
    }
    return { ...mockOverdueReportFAC1, facilityId };
  } catch (error) {
    console.warn('Lỗi gọi API /reports/facility/{id}/overdue-debt, fallback mock:', error);
    return { ...mockOverdueReportFAC1, facilityId };
  }
}

/**
 * 3. Lấy danh sách hợp đồng cơ sở phân trang theo trạng thái hoặc sắp hết hạn (FM-06)
 * Endpoint: GET /api/v1/reports/facility/{facilityId}/contracts
 */
export async function getFacilityContractsReport(
  facilityId: number,
  params?: {
    status?: string;
    expiringSoonDays?: number;
    page?: number;
    size?: number;
  }
): Promise<{ content: FacilityContractSummary[]; totalElements: number; totalPages: number }> {
  if (isMockEnabled('WS4')) {
    let filtered = [...mockFacilityContractsFAC1];
    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((c) => c.status === params.status);
    }
    if (params?.expiringSoonDays) {
      filtered = filtered.filter((c) => c.nearExpiration);
    }
    return {
      content: filtered,
      totalElements: filtered.length,
      totalPages: 1,
    };
  }

  try {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.expiringSoonDays) query.set('expiringSoonDays', String(params.expiringSoonDays));
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient<ApiResponse<{ content: FacilityContractSummary[]; totalElements: number; totalPages: number }>>(
      `/reports/facility/${facilityId}/contracts${queryString}`
    );

    if (res && res.data) {
      return res.data;
    }
    return {
      content: mockFacilityContractsFAC1,
      totalElements: mockFacilityContractsFAC1.length,
      totalPages: 1,
    };
  } catch (error) {
    console.warn('Lỗi gọi API /reports/facility/{id}/contracts, fallback mock:', error);
    return {
      content: mockFacilityContractsFAC1,
      totalElements: mockFacilityContractsFAC1.length,
      totalPages: 1,
    };
  }
}

/**
 * 4. Lấy danh sách cơ sở khả dụng cho quản lý (SA-03, US-FM-06.1 AC-5)
 */
export async function getAssignedFacilities(): Promise<FacilityInfo[]> {
  if (isMockEnabled('WS4')) {
    return mockFacilities;
  }

  try {
    const res = await apiClient<ApiResponse<FacilityInfo[]> | FacilityInfo[]>('/facilities');
    if ('data' in res && Array.isArray(res.data)) {
      return res.data;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return mockFacilities;
  } catch (error) {
    console.warn('Lỗi gọi API /facilities, fallback mock:', error);
    return mockFacilities;
  }
}
