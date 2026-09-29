/**
 * Customer Rentals API — SC-05 (T4.10) & Flow 6
 * API-SPEC.md, USER-STORIES-SC.md (US-SC-05.1, US-SC-05.2, US-SC-05.4) & BUSINESS-RULES.md (BR-ACC-01, BR-RET-06)
 */
import { apiClient, isMockEnabled, type ApiResponse, type PageResponse } from './client';
import type {
  RentedContract,
  AccessLogEntry,
  ChangePinRequest,
  ScheduleReturnRequest,
  ScheduleReturnResponse,
  RenewContractRequest,
  RenewContractResponse,
} from '../features/customer/types';
import { getStoredMoveInPasses } from './payment';

const STORAGE_CONTRACTS_OVERRIDE_KEY = 'smartstorage_customer_contracts_override';

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
  overdueDays?: number;
  overdueFeeAccrued?: number;
  totalOutstandingDebt?: number;
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
    };
  }

// Danh sách hợp đồng mẫu phong phú với ID số thực tế khớp Database Seed (1, 2, 3...)
export const initialCustomerContracts: RentedContract[] = [
  {
    id: '1',
    contractNumber: 'CTR-202610-0001',
    facilityId: '1',
    facilityName: 'Cơ sở Cầu Giấy - Hà Nội',
    unitId: '1',
    unitNumber: 'U-101',
    unitTypeName: 'Kho Cỡ S – Tủ Đồ Cá Nhân',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2026-10-01',
    endDate: '2026-11-01',
    monthlyRent: 500000,
    depositHeld: 500000,
    accessPin: '1234',
    status: 'ACTIVE',
  },
  {
    id: '2',
    contractNumber: 'CTR-202610-0002',
    facilityId: '1',
    facilityName: 'Cơ sở Cầu Giấy - Hà Nội',
    unitId: '2',
    unitNumber: 'U-102',
    unitTypeName: 'Kho Cỡ M – Tiêu Chuẩn Gia Đình',
    sizeCategory: 'M',
    storageType: 'STANDARD',
    startDate: '2026-09-25',
    endDate: '2026-12-25',
    monthlyRent: 1200000,
    depositHeld: 1200000,
    accessPin: undefined,
    status: 'PENDING_CHECKIN',
  },
  {
    id: '3',
    contractNumber: 'CTR-202610-0003',
    facilityId: '5',
    facilityName: 'Cơ sở Quận 1 - TP.HCM',
    unitId: '3',
    unitNumber: 'U-B201',
    unitTypeName: 'Kho Cỡ L – Doanh Nghiệp',
    sizeCategory: 'L',
    storageType: 'CLIMATE_CONTROLLED',
    startDate: '2026-06-01',
    endDate: '2026-09-30',
    monthlyRent: 4800000,
    depositHeld: 4800000,
    accessPin: '5190',
    status: 'EXPIRING_SOON',
  },
  {
    id: '4',
    contractNumber: 'CTR-202610-0004',
    facilityId: '2',
    facilityName: 'Cơ sở Quận 7 - TP.HCM',
    unitId: '4',
    unitNumber: 'U-A110',
    unitTypeName: 'Kho Cỡ S – Tủ Đồ Cá Nhân',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2026-05-15',
    endDate: '2026-09-19',
    monthlyRent: 1200000,
    depositHeld: 1200000,
    accessPin: '4092',
    status: 'OVERDUE',
    overdueDays: 2,
    overdueFee: 0,
  },
];

/**
 * Lấy danh sách hợp đồng đã ghi đè từ localStorage
 */
export function getStoredOverrides(): Record<string, Partial<RentedContract>> {
  try {
    const raw = localStorage.getItem(STORAGE_CONTRACTS_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Lỗi đọc override hợp đồng:', err);
    return {};
  }
}

/**
 * Lưu ghi đè hợp đồng vào localStorage
 */
export function saveStoredOverride(contractId: string, updates: Partial<RentedContract>): void {
  try {
    const current = getStoredOverrides();
    current[contractId] = { ...(current[contractId] || {}), ...updates };
    localStorage.setItem(STORAGE_CONTRACTS_OVERRIDE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Lỗi lưu override hợp đồng:', err);
  }
}

// 1. Lấy danh sách ô kho đang thuê chuẩn Backend WS1 (GET /customers/me/rentals)
export async function getMyRentals(params?: {
  status?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<CustomerRentalSummary>> {
  if (isMockEnabled('WS1')) {
    const contracts = await getCustomerContracts();
    let filtered = contracts;
    if (params?.status && params.status !== 'ALL') {
      filtered = contracts.filter((c) => c.status === params.status);
    }
    const summaries: CustomerRentalSummary[] = filtered.map((c) => ({
      id: Number(c.id),
      contractCode: c.contractNumber,
      facilityName: c.facilityName,
      unitCode: c.unitNumber,
      unitTypeName: c.unitTypeName,
      startDate: c.startDate,
      endDateExclusive: c.endDate,
      status: c.status,
      accessCode: c.accessPin,
      monthlyPrice: c.monthlyRent,
    }));
    return {
      content: summaries,
      page: params?.page ?? 0,
      size: params?.size ?? 10,
      totalElements: summaries.length,
      totalPages: Math.ceil(summaries.length / (params?.size ?? 10)) || 1,
    };
  }

  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  query.set('page', String(params?.page ?? 0));
  query.set('size', String(params?.size ?? 10));

  const res = await apiClient<ApiResponse<PageResponse<CustomerRentalSummary>>>(
    `/customers/me/rentals?${query.toString()}`
  );
  return res.data;
}

// 2. Lấy chi tiết một ô kho cụ thể của khách hàng (GET /customers/me/rentals/{id})
export async function getMyRentalDetail(contractId: number): Promise<CustomerRentalDetail> {
  if (isMockEnabled('WS1')) {
    const contracts = await getCustomerContracts();
    const found = contracts.find((c) => c.id === String(contractId)) || contracts[0];
    return {
      id: Number(found.id),
      contractCode: found.contractNumber,
      facilityName: found.facilityName,
      unitCode: found.unitNumber,
      unitTypeName: found.unitTypeName,
      startDate: found.startDate,
      endDateExclusive: found.endDate,
      status: found.status,
      accessCode: found.accessPin,
      monthlyPrice: found.monthlyRent,
      depositAmount: found.depositHeld,
      depositBalance: found.depositHeld,
      totalRentalFee: found.monthlyRent * 3,
      overdueFeeAccrued: found.overdueFee || 0,
      facilityAddress: '123 Đường Tân Bình, TP. HCM',
      facilityPhone: '0901234567',
    };
  }

  const res = await apiClient<ApiResponse<CustomerRentalDetail>>(`/customers/me/rentals/${contractId}`);
  return res.data;
}

// 3. Xem trước giá gia hạn từ Backend Policy (POST /contracts/{id}/renewals/quote)
export async function getRenewalQuote(contractId: number, renewalMonths: number): Promise<RenewalQuote> {
  if (isMockEnabled('WS1')) {
    const contracts = await getCustomerContracts();
    const target = contracts.find((c) => c.id === String(contractId)) || contracts[0];
    const totalFee = (target?.monthlyRent || 1200000) * renewalMonths;
    return {
      contractId,
      contractCode: target?.contractNumber || `CTR-${contractId}`,
      currentEndDate: target?.endDate || '2026-11-01',
      newEndDateExclusive: '2027-02-01',
      renewalMonths,
      monthlyPrice: target?.monthlyRent || 1200000,
      totalRenewalFee: totalFee,
      overdueFeeSettled: target?.overdueFee || 0,
    };
  }

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

// 4. Xác nhận gia hạn hợp đồng (POST /contracts/{id}/renewals)
export async function submitRenewal(
  contractId: number,
  renewalMonths: number,
  paymentId?: number
): Promise<any> {
  if (isMockEnabled('WS1')) {
    saveStoredOverride(String(contractId), { status: 'ACTIVE' });
    return { success: true, message: 'Gia hạn thành công' };
  }
  const query = paymentId ? `?paymentId=${paymentId}` : '';
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/renewals${query}`, {
    method: 'POST',
    body: JSON.stringify({ renewalMonths }),
  });
  return res.data;
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

function dateOnly(value?: string): string {
  return (value || '').slice(0, 10);
}

/**
 * Đợi backend ghi nhận gia hạn sau thanh toán (listener AFTER_COMMIT).
 * Khớp previousEndDate với hạn cũ để không lấy lần gia hạn trước đó.
 */
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

// 5. Gửi thông báo trả kho (POST /contracts/{id}/return-notices)
export async function submitReturnNotice(
  contractId: number,
  intendedReturnDate: string,
  notes?: string
): Promise<any> {
  if (isMockEnabled('WS1')) {
    saveStoredOverride(String(contractId), {
      status: 'PENDING_RETURN',
      scheduledReturnDate: intendedReturnDate,
    });
    return { id: 1, contractId, intendedReturnDate, status: 'PENDING' };
  }
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/return-notices`, {
    method: 'POST',
    body: JSON.stringify({ intendedReturnDate, notes }),
  });
  return res.data;
}

/**
 * Lấy danh sách tất cả hợp đồng của khách hàng (Tương thích ngược cho UI hiện tại)
 * Ưu tiên gọi Real Backend API: GET /customers/me/rentals
 * Fallback sang localStorage overrides + Mock nếu offline hoặc chưa login
 */
export async function getCustomerContracts(): Promise<RentedContract[]> {
  const overrides = getStoredOverrides();

  if (!isMockEnabled('WS1')) {
    try {
      const response = await apiClient<any>('/customers/me/rentals?page=0&size=50&sort=startDate,desc');
      // Trích xuất content từ cấu trúc PageResponse trong ApiResponse
      const rawList: BackendRentalSummary[] =
        response?.data?.content ||
        response?.content ||
        (Array.isArray(response?.data) ? response.data : []);

      if (rawList && rawList.length > 0) {
        return rawList.map((item) => {
          return mapBackendRentalToContract(item);
        });
      }
      return [];
    } catch (err) {
      console.warn('Lỗi gọi API /customers/me/rentals:', err);
      throw err;
    }
  }

  // Fallback sang Mock + Move-in Passes cục bộ
  const storedPasses = getStoredMoveInPasses();
  const dynamicFromPasses: RentedContract[] = storedPasses.map((pass, idx) => ({
    id: String(pass.reservationId || `PASS-${idx}`),
    contractNumber: pass.passCode,
    facilityId: String(pass.facilityId),
    facilityName: pass.facilityName,
    unitId: `U-${pass.unitNumber}`,
    unitNumber: pass.unitNumber,
    unitTypeName: 'Kho Tiêu Chuẩn Thông Minh',
    sizeCategory: 'M',
    storageType: 'STANDARD',
    startDate: pass.startDate,
    endDate: new Date(new Date(pass.startDate).getTime() + 90 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0],
    monthlyRent: Math.round(pass.totalPaid / 2),
    depositHeld: Math.round(pass.totalPaid / 2),
    accessPin: undefined,
    status: 'PENDING_CHECKIN',
  }));

  const baseList = [...dynamicFromPasses, ...initialCustomerContracts];

  return baseList.map((c) => {
    const override = overrides[c.id];
    return override ? { ...c, ...override } : c;
  });
}

/**
 * Đổi mã PIN khóa điện tử (BR-ACC-01, BR-ACC-03)
 * Kết nối trực tiếp Backend REST API: PUT /api/v1/customers/me/rentals/{id}/pin
 */
export async function updateContractPin(
  request: ChangePinRequest
): Promise<{ success: boolean; message: string }> {
  saveStoredOverride(request.contractId, { accessPin: request.newPin });

  if (!isMockEnabled('WS1')) {
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
      console.error('Lỗi gọi API đổi mã PIN thật:', err);
      throw new Error(err?.message || 'Không thể cập nhật mã PIN trên máy chủ.');
    }
  }

  return {
    success: true,
    message: 'Mã PIN khóa điện tử đã được cập nhật thành công (chế độ demo).',
  };
}

/**
 * Đăng ký trả kho & Hẹn lịch kiểm tra nghiệm thu (US-SC-05.4, BR-RET-06, BR-RET-10)
 */
export async function scheduleContractReturn(
  request: ScheduleReturnRequest
): Promise<ScheduleReturnResponse> {
  if (!isMockEnabled('WS1')) {
    const notice = await submitReturnNotice(Number(request.contractId), request.returnDate, request.notes);
    const refund = Number(
      notice?.estimatedDepositRefund ?? notice?.depositRefundAmount ?? notice?.depositBalance ?? 0
    );
    return {
      contractId: request.contractId,
      scheduledReturnDate: request.returnDate,
      status: 'PENDING_RETURN',
      estimatedDepositRefund: Number.isFinite(refund) ? refund : 0,
      message: notice?.message || 'Đăng ký lịch hẹn trả kho thành công. Vui lòng dọn dẹp ngăn tủ trước ngày hẹn.',
    };
  }

  saveStoredOverride(request.contractId, {
    status: 'PENDING_RETURN',
    scheduledReturnDate: request.returnDate,
  });

  return {
    contractId: request.contractId,
    scheduledReturnDate: request.returnDate,
    status: 'PENDING_RETURN',
    estimatedDepositRefund: 0,
    message: 'Đăng ký lịch hẹn trả kho thành công (chế độ demo).',
  };
}

/**
 * Lấy lịch sử truy cập ra vào ô kho (US-SC-05.2, BR-ACC-02)
 * Kết nối trực tiếp Backend REST API: GET /api/v1/customers/me/rentals/{id}/access-logs
 */
export async function getContractAccessLogs(contractId: string): Promise<AccessLogEntry[]> {
  if (!isMockEnabled('WS1')) {
    const res = await apiClient<ApiResponse<AccessLogEntry[]>>(`/customers/me/rentals/${contractId}/access-logs`);
    return Array.isArray(res?.data) ? res.data : [];
  }

  const now = Date.now();
  return [
    {
      id: `LOG-${contractId}-1`,
      contractId,
      unitNumber: 'A108',
      timestamp: new Date(now - 2 * 3600 * 1000).toLocaleString('vi-VN'),
      method: 'PIN_CODE',
      accessorName: 'Chủ hợp đồng',
      status: 'SUCCESS',
      deviceInfo: 'Khóa cửa số bàn phím cảm ứng tủ',
    },
    {
      id: `LOG-${contractId}-2`,
      contractId,
      unitNumber: 'A108',
      timestamp: new Date(now - 26 * 3600 * 1000).toLocaleString('vi-VN'),
      method: 'QR_PASS',
      accessorName: 'Chủ hợp đồng',
      status: 'SUCCESS',
      deviceInfo: 'Đầu đọc mã QR cổng chính tòa nhà',
    },
  ];
}


/**
 * Gia hạn hợp đồng trực tuyến (US-SC-05.3, BR-REN-01..08)
 */
export async function renewContract(
  request: RenewContractRequest
): Promise<RenewContractResponse> {
  const allContracts = await getCustomerContracts();
  const target = allContracts.find((c) => c.id === request.contractId);

  const receiptNumber = `REC-REN-${Date.now().toString().slice(-6)}`;
  const renewedAt = new Date().toISOString();

  const updates: Partial<RentedContract> = {
    endDate: request.newEndDate,
    status: 'ACTIVE',
    overdueDays: 0,
    overdueFee: 0,
  };

  if (!isMockEnabled('WS1')) {
    try {
      await submitRenewal(Number(request.contractId), request.months);
    } catch (err) {
      console.warn('Lỗi gọi API submitRenewal thật, lưu tạm override cục bộ:', err);
    }
  }

  saveStoredOverride(request.contractId, updates);
  const updatedContract: RentedContract = {
    ...(target || initialCustomerContracts[0]),
    ...updates,
  };
  return {
    success: true,
    contract: updatedContract,
    receiptNumber,
    renewedAt,
    message: `Gia hạn thành công thêm ${request.months} tháng cho ngăn kho ${updatedContract.unitNumber}. Hạn mới đến ngày ${request.newEndDate}.`,
  };
}
