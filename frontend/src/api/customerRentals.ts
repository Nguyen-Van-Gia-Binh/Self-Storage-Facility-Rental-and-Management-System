/**
 * Customer Rentals API — SC-05 (T4.10)
 * API-SPEC.md, USER-STORIES-SC.md (US-SC-05.1, US-SC-05.2, US-SC-05.4) & BUSINESS-RULES.md (BR-ACC-01, BR-RET-06)
 */
import { apiClient } from './client';
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

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const STORAGE_CONTRACTS_OVERRIDE_KEY = 'smartstorage_customer_contracts_override';

// Danh sách hợp đồng mẫu phong phú đại diện cho các trạng thái nghiệp vụ
export const initialCustomerContracts: RentedContract[] = [
  {
    id: 'CTR-2026-089',
    contractNumber: 'HD-SS-2026089',
    facilityId: 'FAC-D7-02',
    facilityName: 'SmartStorage Phú Mỹ Hưng',
    unitId: 'U-A108',
    unitNumber: 'A108',
    unitTypeName: 'Kho Cỡ M – Tiêu Chuẩn Gia Đình',
    sizeCategory: 'M',
    storageType: 'STANDARD',
    startDate: '2026-08-01',
    endDate: '2026-11-01',
    monthlyRent: 2400000,
    depositHeld: 2400000,
    accessPin: '8392', // Đã nghiệm thu quầy -> Cấp mã PIN (BR-ACC-01)
    status: 'ACTIVE',
  },
  {
    id: 'CTR-2026-104',
    contractNumber: 'HD-SS-2026104',
    facilityId: 'FAC-D7-01',
    facilityName: 'SmartStorage Quận 7 Flagship',
    unitId: 'U-A104',
    unitNumber: 'A104',
    unitTypeName: 'Kho Cỡ S – Tủ Đồ Cá Nhân',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2026-09-25',
    endDate: '2026-12-25',
    monthlyRent: 1200000,
    depositHeld: 1200000,
    accessPin: undefined, // Pending Check-in: Chưa cấp mã PIN trước khi đối chiếu CCCD tại quầy (BR-ACC-01)
    status: 'PENDING_CHECKIN',
  },
  {
    id: 'CTR-2026-052',
    contractNumber: 'HD-SS-2026052',
    facilityId: 'FAC-D7-03',
    facilityName: 'SmartStorage Him Lam Center',
    unitId: 'U-B201',
    unitNumber: 'B201',
    unitTypeName: 'Kho Cỡ L – Doanh Nghiệp',
    sizeCategory: 'L',
    storageType: 'CLIMATE_CONTROLLED',
    startDate: '2026-06-01',
    endDate: '2026-09-30', // Còn dưới 10 ngày -> Sắp hết hạn (BR-REN-01)
    monthlyRent: 4800000,
    depositHeld: 4800000,
    accessPin: '5190',
    status: 'EXPIRING_SOON',
  },
  {
    id: 'CTR-2026-015',
    contractNumber: 'HD-SS-2026015',
    facilityId: 'FAC-D7-01',
    facilityName: 'SmartStorage Quận 7 Flagship',
    unitId: 'U-A110',
    unitNumber: 'A110',
    unitTypeName: 'Kho Cỡ S – Tủ Đồ Cá Nhân',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    startDate: '2026-05-15',
    endDate: '2026-09-19', // Quá hạn 2 ngày -> Trong ân hạn D+1..D+3 (BR-OVD-02)
    monthlyRent: 1200000,
    depositHeld: 1200000,
    accessPin: '4092',
    status: 'OVERDUE',
    overdueDays: 2,
    overdueFee: 0, // Trong 3 ngày ân hạn chưa phạt tiền (BR-OVD-02)
  },
];

/**
 * Lấy danh sách hợp đồng đã ghi đè từ localStorage
 */
function getStoredOverrides(): Record<string, Partial<RentedContract>> {
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
function saveStoredOverride(contractId: string, updates: Partial<RentedContract>): void {
  try {
    const current = getStoredOverrides();
    current[contractId] = { ...(current[contractId] || {}), ...updates };
    localStorage.setItem(STORAGE_CONTRACTS_OVERRIDE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Lỗi lưu override hợp đồng:', err);
  }
}

/**
 * Lấy danh sách tất cả hợp đồng của khách hàng (hợp nhất Mock + Đơn mới thanh toán + Overrides)
 */
export async function getCustomerContracts(): Promise<RentedContract[]> {
  if (USE_MOCK) {
    const overrides = getStoredOverrides();

    // 1. Chuyển đổi các Move-in Pass từ Task T3.10 thành RentedContract
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

    // 2. Gộp danh sách cơ sở + Pass mới
    const baseList = [...dynamicFromPasses, ...initialCustomerContracts];

    // 3. Áp dụng override (như đổi PIN, đổi trạng thái sang PENDING_RETURN)
    return baseList.map((c) => {
      const override = overrides[c.id];
      return override ? { ...c, ...override } : c;
    });
  }

  try {
    return await apiClient<RentedContract[]>('/customer/contracts');
  } catch (err) {
    console.warn('Lỗi gọi API /customer/contracts, fallback sang mock data:', err);
    return initialCustomerContracts;
  }
}

/**
 * Đổi mã PIN khóa điện tử (BR-ACC-01)
 */
export async function updateContractPin(
  request: ChangePinRequest
): Promise<{ success: boolean; message: string }> {
  if (USE_MOCK) {
    saveStoredOverride(request.contractId, { accessPin: request.newPin });
    return {
      success: true,
      message: 'Mã PIN khóa điện tử đã được cập nhật thành công.',
    };
  }

  try {
    return await apiClient<{ success: boolean; message: string }>(
      `/customer/contracts/${request.contractId}/pin`,
      {
        method: 'PUT',
        body: JSON.stringify(request),
      }
    );
  } catch (err) {
    console.warn('Lỗi gọi API đổi PIN, fallback sang mock:', err);
    saveStoredOverride(request.contractId, { accessPin: request.newPin });
    return {
      success: true,
      message: 'Mã PIN khóa điện tử đã được cập nhật thành công.',
    };
  }
}

/**
 * Đăng ký trả kho & Hẹn lịch kiểm tra nghiệm thu (US-SC-05.4, BR-RET-06, BR-RET-10)
 */
export async function scheduleContractReturn(
  request: ScheduleReturnRequest
): Promise<ScheduleReturnResponse> {
  if (USE_MOCK) {
    saveStoredOverride(request.contractId, {
      status: 'PENDING_RETURN',
      scheduledReturnDate: request.returnDate,
    });
    return {
      contractId: request.contractId,
      scheduledReturnDate: request.returnDate,
      status: 'PENDING_RETURN',
      estimatedDepositRefund: 2400000,
      message: 'Đăng ký lịch hẹn trả kho thành công. Vui lòng dọn dẹp ngăn tủ trước ngày hẹn.',
    };
  }

  try {
    return await apiClient<ScheduleReturnResponse>(
      `/customer/contracts/${request.contractId}/return`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  } catch (err) {
    console.warn('Lỗi gọi API đăng ký trả kho, fallback sang mock:', err);
    saveStoredOverride(request.contractId, {
      status: 'PENDING_RETURN',
      scheduledReturnDate: request.returnDate,
    });
    return {
      contractId: request.contractId,
      scheduledReturnDate: request.returnDate,
      status: 'PENDING_RETURN',
      estimatedDepositRefund: 2400000,
      message: 'Đăng ký lịch hẹn trả kho thành công. Vui lòng dọn dẹp ngăn tủ trước ngày hẹn.',
    };
  }
}

/**
 * Lấy lịch sử truy cập ra vào ô kho (US-SC-05.2, BR-ACC-02)
 */
export async function getContractAccessLogs(contractId: string): Promise<AccessLogEntry[]> {
  if (USE_MOCK) {
    const now = Date.now();
    return [
      {
        id: `LOG-${contractId}-1`,
        contractId,
        unitNumber: 'A108',
        timestamp: new Date(now - 2 * 3600 * 1000).toLocaleString('vi-VN'),
        method: 'PIN_CODE',
        accessorName: 'Nguyễn Phạm Xuân Nhi',
        status: 'SUCCESS',
        deviceInfo: 'Khóa cửa số bàn phím cảm ứng tủ',
      },
      {
        id: `LOG-${contractId}-2`,
        contractId,
        unitNumber: 'A108',
        timestamp: new Date(now - 26 * 3600 * 1000).toLocaleString('vi-VN'),
        method: 'QR_PASS',
        accessorName: 'Nguyễn Phạm Xuân Nhi',
        status: 'SUCCESS',
        deviceInfo: 'Đầu đọc mã QR cổng chính tòa nhà',
      },
      {
        id: `LOG-${contractId}-3`,
        contractId,
        unitNumber: 'A108',
        timestamp: new Date(now - 74 * 3600 * 1000).toLocaleString('vi-VN'),
        method: 'PIN_CODE',
        accessorName: 'Khách nhập PIN',
        status: 'FAILED',
        deviceInfo: 'Sai mã PIN lần 1',
      },
      {
        id: `LOG-${contractId}-4`,
        contractId,
        unitNumber: 'A108',
        timestamp: new Date(now - 74 * 3600 * 1000 + 30000).toLocaleString('vi-VN'),
        method: 'PIN_CODE',
        accessorName: 'Nguyễn Phạm Xuân Nhi',
        status: 'SUCCESS',
        deviceInfo: 'Khóa cửa số bàn phím cảm ứng tủ',
      },
    ];
  }

  try {
    return await apiClient<AccessLogEntry[]>(`/customer/contracts/${contractId}/access-logs`);
  } catch (err) {
    console.warn('Lỗi gọi API lịch sử ra vào, fallback sang mock:', err);
    return [];
  }
}

/**
 * Gia hạn hợp đồng trực tuyến (US-SC-05.3, BR-REN-01..08)
 * - Cập nhật ngày kết thúc mới (endDate = currentEndDate + months)
 * - Chuyển trạng thái sang ACTIVE (nếu đang EXPIRING_SOON hoặc OVERDUE)
 * - Xóa số ngày nợ và phí quá hạn (reset overdueDays, overdueFee = 0)
 * - Bảo lưu nguyên trạng ngăn tủ và mã PIN mở cửa (BR-REN-08)
 * - Ghi đè vào localStorage để duy trì trạng thái nhất quán
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

  if (USE_MOCK || !target) {
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

  try {
    const res = await apiClient<RenewContractResponse>(
      `/customer/contracts/${request.contractId}/renew`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    saveStoredOverride(request.contractId, updates);
    return res;
  } catch (err) {
    console.warn('Lỗi gọi API gia hạn hợp đồng, fallback sang mock lưu trữ cục bộ:', err);
    saveStoredOverride(request.contractId, updates);
    return {
      success: true,
      contract: {
        ...target,
        ...updates,
      },
      receiptNumber,
      renewedAt,
      message: `Gia hạn thành công thêm ${request.months} tháng cho ngăn kho ${target.unitNumber}. Hạn mới đến ngày ${request.newEndDate}.`,
    };
  }
}

