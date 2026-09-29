/**
 * Customer Rentals API — SC-05 (T4.10) & Flow 6
 * API-SPEC.md, USER-STORIES-SC.md (US-SC-05.1, US-SC-05.2, US-SC-05.4) & BUSINESS-RULES.md (BR-ACC-01, BR-RET-06)
 * Lấy dữ liệu trực tiếp từ Backend API - không có mock data
 */
import { apiClient, type ApiResponse, type PageResponse } from './client';
import type {
  RentedContract,
  AccessLogEntry,
  ChangePinRequest,
  ScheduleReturnRequest,
  ScheduleReturnResponse,
  RenewContractRequest,
  RenewContractResponse,
} from '../features/customer/types';

// DTO phản hồi tóm tắt hợp đồng từ Backend Spring Boot
export interface BackendRentalSummary {
  contractId: number;
  contractCode: string;
  reservationId?: number;
  reservationCode?: string;
  facilityId?: number;
  facilityName?: string;
  facilityAddress?: string;
  facilityPhone?: string;
  storageUnitId?: number;
  storageUnitCode?: string;
  floor?: number;
  position?: string;
  unitTypeId?: number;
  unitTypeName?: string;
  unitDimensions?: string;
  startDate?: string;
  endDateExclusive?: string;
  rentalMonths?: number;
  monthlyPrice?: number;
  depositAmount?: number;
  depositBalance?: number;
  status: string;
  nearExpiration?: boolean;
  daysRemaining?: number;
  accessCode?: string;
  accessCodeLocked?: boolean;
  inspectionDone?: boolean;
  overdueDays?: number;
  overdueFeeAccrued?: number;
  totalOutstandingDebt?: number;
  hasPendingRenewal?: boolean;
  pendingRenewalOrderCode?: number;
  pendingRenewalMonths?: number;
  pendingRenewalAmount?: number;
  pendingRenewalExpiresAt?: string;
}

export interface CustomerRentalSummary {
  id: number;
  contractCode: string;
  facilityName: string;
  unitCode: string;
  unitTypeName: string;
  startDate: string;
  endDateExclusive: string;
  status: string; // ACTIVE, PENDING_CHECKIN, OVERDUE, etc.
  accessCode?: string;
  monthlyPrice: number;
}

export interface CustomerRentalDetail extends CustomerRentalSummary {
  depositAmount: number;
  depositBalance: number;
  totalRentalFee: number;
  overdueFeeAccrued: number;
  facilityAddress: string;
  facilityPhone: string;
}

export interface RenewalQuote {
  contractId: number;
  contractCode?: string;
  currentEndDate: string;
  newEndDateExclusive: string;
  renewalMonths: number;
  monthlyPrice: number;
  totalRenewalFee: number;
  overdueFeeSettled?: number;
}

export interface AppliedRenewal {
  id: number;
  contractId: number;
  previousEndDate: string;
  newEndDate: string;
  renewalMonths: number;
  totalPaid: number;
  createdAt: string;
}

/**
 * Chuyển đổi dữ liệu BackendRentalSummary sang RentedContract cho UI Frontend
 */
export function mapBackendRentalToContract(item: BackendRentalSummary): RentedContract {
  const typeName = item.unitTypeName || 'Kho Tiêu Chuẩn';
  let sizeCategory: 'S' | 'M' | 'L' | 'XL' = 'S';
  if (typeName.includes('XL')) sizeCategory = 'XL';
  else if (typeName.includes('L')) sizeCategory = 'L';
  else if (typeName.includes('M')) sizeCategory = 'M';

  let mappedStatus = (item.status as any) || 'ACTIVE';
  if (mappedStatus === 'PENDING_CHECK_IN') {
    mappedStatus = 'PENDING_CHECKIN';
  }

  return {
    id: String(item.contractId),
    contractNumber: item.contractCode || `CTR-${item.contractId}`,
    facilityId: item.facilityId ? String(item.facilityId) : '1',
    facilityName: item.facilityName || 'SmartStorage Facility',
    unitId: item.storageUnitId ? String(item.storageUnitId) : (item.storageUnitCode || 'U-101'),
    unitNumber: item.storageUnitCode || 'U-101',
    unitTypeName: typeName,
    sizeCategory,
    storageType: 'STANDARD',
    startDate: item.startDate || '',
    endDate: item.endDateExclusive || '',
    monthlyRent: item.monthlyPrice || 0,
    depositHeld: item.depositBalance ?? item.depositAmount ?? 0,
    accessPin: item.accessCode || undefined,
    status: mappedStatus,
    overdueDays: item.overdueDays || 0,
    overdueFee: item.overdueFeeAccrued || 0,
    inspectionDone: Boolean(item.inspectionDone),
    hasPendingRenewal: Boolean(item.hasPendingRenewal),
    pendingRenewalOrderCode: item.pendingRenewalOrderCode,
    pendingRenewalMonths: item.pendingRenewalMonths,
    pendingRenewalAmount: item.pendingRenewalAmount,
    pendingRenewalExpiresAt: item.pendingRenewalExpiresAt,
  };
}

/**
 * Lấy danh sách ô kho đang thuê (GET /customers/me/rentals)
 */
export async function getMyRentals(params?: {
  status?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<CustomerRentalSummary>> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 10));

  const res = await apiClient<ApiResponse<PageResponse<CustomerRentalSummary>>>(
    `/customers/me/rentals?${query.toString()}`
  );
  return res.data;
}

/**
 * Lấy chi tiết một ô kho cụ thể của khách hàng (GET /customers/me/rentals/{id})
 */
export async function getMyRentalDetail(contractId: number): Promise<CustomerRentalDetail> {
  const res = await apiClient<ApiResponse<CustomerRentalDetail>>(`/customers/me/rentals/${contractId}`);
  return res.data;
}

/**
 * Xem trước giá gia hạn (POST /contracts/{id}/renewals/quote)
 */
export async function getRenewalQuote(contractId: number, renewalMonths: number): Promise<RenewalQuote> {
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/renewals/quote`, {
    method: 'POST',
    body: JSON.stringify({ renewalMonths }),
  });
  const d = res.data;
  return {
    contractId: d.contractId,
    contractCode: d.contractCode,
    currentEndDate: d.previousEndDate || d.currentEndDate,
    newEndDateExclusive: d.newEndDate || d.newEndDateExclusive,
    renewalMonths: d.renewalMonths,
    monthlyPrice: d.monthlyPriceSnapshot || d.monthlyPrice || 0,
    totalRenewalFee: d.rentalFeeAmount || d.totalRenewalFee || d.totalAmount || 0,
    overdueFeeSettled: d.overdueFeeSettled || 0,
  };
}

/**
 * Xác nhận gia hạn hợp đồng (POST /contracts/{id}/renewals)
 */
export async function submitRenewal(
  contractId: number,
  renewalMonths: number,
  paymentId?: number
): Promise<any> {
  const query = paymentId ? `?paymentId=${paymentId}` : '';
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/renewals${query}`, {
    method: 'POST',
    body: JSON.stringify({ renewalMonths }),
  });
  return res.data;
}

/**
 * Đợi backend ghi nhận gia hạn sau thanh toán (listener AFTER_COMMIT).
 */
function dateOnly(value?: string): string {
  return (value || '').slice(0, 10);
}

export async function waitForAppliedRenewal(
  contractId: number,
  previousEndDate: string,
): Promise<AppliedRenewal> {
  const expected = dateOnly(previousEndDate);
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const res = await apiClient<ApiResponse<AppliedRenewal[]>>(`/contracts/${contractId}/renewals`);
      const history = Array.isArray(res?.data) ? res.data : [];
      const applied = history.find((item) => dateOnly(item.previousEndDate) === expected);
      if (applied?.newEndDate) {
        return applied;
      }
    } catch (err) {
      console.warn('Chưa đọc được lịch sử gia hạn:', err);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Hệ thống chưa ghi nhận ngày hết hạn mới sau thanh toán.');
}

/**
 * Gửi thông báo trả kho (POST /contracts/{id}/return-notices)
 */
export async function submitReturnNotice(
  contractId: number,
  intendedReturnDate: string,
  notes?: string
): Promise<any> {
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/return-notices`, {
    method: 'POST',
    body: JSON.stringify({ intendedReturnDate, notes }),
  });
  return res.data;
}

/**
 * Lấy danh sách tất cả hợp đồng của khách hàng hiện tại (GET /customers/me/rentals)
 * Dữ liệu được lấy trực tiếp từ Backend API - không có mock data
 */
export async function getCustomerContracts(): Promise<RentedContract[]> {
  try {
    const response = await apiClient<any>('/customers/me/rentals?page=0&size=50&sort=startDate,desc');
    const rawList: BackendRentalSummary[] =
      response?.data?.content ||
      response?.content ||
      (Array.isArray(response?.data) ? response.data : []);

    if (rawList && rawList.length > 0) {
      return rawList.map((item) => mapBackendRentalToContract(item));
    }
    return [];
  } catch (err) {
    console.error('Lỗi gọi API /customers/me/rentals:', err);
    throw err;
  }
}

/**
 * Đổi mã PIN khóa điện tử (BR-ACC-01, BR-ACC-03)
 * PUT /customers/me/rentals/{id}/pin
 */
export async function updateContractPin(
  request: ChangePinRequest
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiClient<ApiResponse<void>>(`/customers/me/rentals/${request.contractId}/pin`, {
      method: 'PUT',
      body: JSON.stringify({ newPin: request.newPin }),
    });
    return {
      success: true,
      message: res.message || 'Mã PIN khóa điện tử đã được cập nhật thành công.',
    };
  } catch (err: any) {
    console.error('Lỗi gọi API đổi mã PIN:', err);
    throw new Error(err?.message || 'Không thể cập nhật mã PIN trên máy chủ.');
  }
}

/**
 * Đăng ký trả kho & Hẹn lịch kiểm tra nghiệm thu (US-SC-05.4, BR-RET-06, BR-RET-10)
 */
export async function scheduleContractReturn(
  request: ScheduleReturnRequest
): Promise<ScheduleReturnResponse> {
  const notice = await submitReturnNotice(Number(request.contractId), request.returnDate, request.notes);
  const refund = Number(
    notice?.estimatedDepositRefund ?? notice?.depositRefundAmount ?? notice?.depositBalance ?? 0
  );
  return {
    contractId: request.contractId,
    scheduledReturnDate: request.returnDate,
    status: 'PENDING_RETURN',
    estimatedDepositRefund: Number.isFinite(refund) ? refund : 0,
    message: notice?.message || 'Đăng ký lịch hẹn trả kho thành công. Vui lòng dọn dẹp ô kho trước ngày hẹn.',
  };
}

/**
 * Lấy lịch sử truy cập ra vào ô kho (US-SC-05.2, BR-ACC-02)
 * GET /customers/me/rentals/{id}/access-logs
 */
export async function getContractAccessLogs(contractId: string): Promise<AccessLogEntry[]> {
  const res = await apiClient<ApiResponse<AccessLogEntry[]>>(`/customers/me/rentals/${contractId}/access-logs`);
  return Array.isArray(res?.data) ? res.data : [];
}

/**
 * Hủy yêu cầu trả kho khi nhân viên chưa nghiệm thu (BR-RET-12)
 * POST /contracts/{contractId}/cancel-return
 */
export async function cancelContractReturn(contractId: number | string): Promise<any> {
  return apiClient(`/contracts/${contractId}/cancel-return`, { method: 'POST' });
}

/**
 * Gia hạn hợp đồng trực tuyến (US-SC-05.3, BR-REN-01..08)
 */
export async function renewContract(
  request: RenewContractRequest
): Promise<RenewContractResponse> {
  try {
    // Gọi API gia hạn
    await submitRenewal(Number(request.contractId), request.months);

    // Sau khi gia hạn thành công, lấy lại thông tin hợp đồng mới
    const contracts = await getCustomerContracts();
    const updatedContract = contracts.find((c) => c.id === request.contractId);

    const receiptNumber = `REC-REN-${Date.now().toString().slice(-6)}`;
    const renewedAt = new Date().toISOString();

    return {
      success: true,
      contract: updatedContract!,
      receiptNumber,
      renewedAt,
      message: `Gia hạn thành công thêm ${request.months} tháng cho ô kho ${updatedContract?.unitNumber}. Hạn mới đến ngày ${request.newEndDate}.`,
    };
  } catch (err) {
    console.error('Lỗi gia hạn hợp đồng:', err);
    throw err;
  }
}
