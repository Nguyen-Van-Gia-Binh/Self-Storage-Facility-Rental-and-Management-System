import { apiClient, isMockEnabled } from './client';
import type { ApiResponse, PageResponse } from './client';
import type {
  CheckInContract,
  CheckInSubmitRequest,
  CheckInSubmitResponse,
  HandoverRejectRequest,
  HandoverRejectResponse,
  ReturnContractDetail,
  ReturnInspectionRequest,
  ReturnInspectionResponse,
  SettlementPreviewData,
} from '../types';
import type {
  ManagerContractItem,
  ContractKpiData,
  ReassignUnitRequest,
  AvailableUnitOption,
  ContractFinancialSummary,
  SettlementApprovalRequest,
} from '../types/contractManager';
import mockContractsData from '../mock/mock-contracts.json';
import mockReturnContractsData from '../mock/mock-return-contracts.json';

// USE_MOCK cục bộ đã được thay bằng isMockEnabled('WS2') từ @/api/client

// Bộ nhớ đệm tạm thời cho mock session (cho phép cập nhật trạng thái ngay trên UI khi test)
let localMockContracts: CheckInContract[] = JSON.parse(JSON.stringify(mockContractsData));
let localMockReturnContracts: ReturnContractDetail[] = JSON.parse(JSON.stringify(mockReturnContractsData));

/**
 * Ánh xạ dữ liệu ContractSummaryResponse từ Backend sang CheckInContract cho UI Staff
 */
export function mapBackendSummaryToCheckInContract(item: any): CheckInContract {
  if (!item) return item;

  // Trích xuất tầng và khu vực từ mã ô kho (ví dụ: Q1-A104 -> Khu A, Tầng 1)
  const unitCode = item.storageUnitCode || 'U-101';
  let floor = item.floor || 1;
  let zone = 'Khu A';
  const parts = unitCode.split('-');
  const suffix = parts.length > 1 ? parts[1] : parts[0];
  if (suffix && suffix.length > 1) {
    zone = `Khu ${suffix.charAt(0)}`;
    const floorDigit = parseInt(suffix.charAt(1), 10);
    if (!isNaN(floorDigit) && floorDigit > 0) {
      floor = floorDigit;
    }
  }

  // Tính toán thời gian hẹn và ngày ân hạn
  const todayStr = new Date().toISOString().split('T')[0];
  const startDateStr = item.startDate || todayStr;
  let appointmentTime = 'Hôm nay (09:00 - 18:00)';
  if (startDateStr > todayStr) {
    appointmentTime = `Ngày bắt đầu: ${startDateStr}`;
  } else if (startDateStr < todayStr) {
    appointmentTime = `Đang ân hạn nhận kho (từ ${startDateStr})`;
  }

  // 10 ngày ân hạn theo quy chuẩn
  const startDayTime = new Date(startDateStr).getTime();
  const nowDayTime = new Date(todayStr).getTime();
  const diffDays = Math.floor((nowDayTime - startDayTime) / (1000 * 3600 * 24));
  const graceDaysRemaining = Math.max(0, 10 - diffDays);

  return {
    id: item.id,
    code: item.code || `CTR-${item.id}`,
    reservationId: item.reservationId || item.id,
    reservationCode: item.reservationCode || item.code?.replace('CTR', 'RSV') || `RSV-${item.id}`,
    customerId: item.customerId || 1,
    customerName: item.customerName || 'Khách hàng',
    customerPhone: item.customerPhone || '0901234567',
    customerIdentityNumber: item.customerIdentityNumber || item.identityNumber || '079099007890',
    facilityId: item.facilityId || 1,
    facilityName: item.facilityName || 'Cơ sở SmartStorage',
    storageUnitId: item.storageUnitId || 1,
    storageUnitCode: unitCode,
    floor: floor,
    position: item.position || `${zone} • Tầng ${floor}`,
    unitTypeId: item.unitTypeId || 1,
    unitTypeName: item.unitTypeName || 'Kho Tiêu Chuẩn',
    unitTypeDimensions: item.unitTypeDimensions || '2.0m x 2.0m x 2.5m',
    startDate: item.startDate || todayStr,
    endDateExclusive: item.endDateExclusive || '',
    rentalMonths: item.rentalMonths || 1,
    monthlyPrice: item.monthlyPrice || 0,
    totalRentalFee: (item.monthlyPrice || 0) * (item.rentalMonths || 1),
    depositAmount: item.depositAmount || item.monthlyPrice || 0,
    totalPayable: item.totalPayable || ((item.monthlyPrice || 0) * (item.rentalMonths || 1) + (item.depositAmount || item.monthlyPrice || 0)),
    isFullyPaid: true, // Hợp đồng PENDING_CHECK_IN đều đã hoàn tất thanh toán cọc ở Flow 1
    status: item.status || 'PENDING_CHECK_IN',
    appointmentTime: appointmentTime,
    graceDaysRemaining: graceDaysRemaining,
  };
}

/**
 * Lấy danh sách hợp đồng chờ Check-in tại quầy
 * Nếu mock mode = true: trả về dữ liệu mẫu trong mock-contracts.json
 * Nếu gọi API thật: gọi GET /contracts?status=PENDING_CHECK_IN
 */
export async function getPendingContracts(facilityId?: number): Promise<CheckInContract[]> {
  if (isMockEnabled('WS2')) {
    let list = [...localMockContracts];
    if (facilityId) list = list.filter((c) => c.facilityId === facilityId);
    return list;
  }

  const query = new URLSearchParams({ status: 'PENDING_CHECK_IN', page: '0', size: '50' });
  if (facilityId) query.set('facilityIds', String(facilityId));

  const res = await apiClient<ApiResponse<PageResponse<any>>>(
    `/contracts?${query.toString()}`
  );
  const rawList = res.data?.content ?? [];
  return rawList.map(mapBackendSummaryToCheckInContract);
}

/**
 * Lấy thông tin chi tiết một hợp đồng theo ID
 */
export async function getContractById(id: number): Promise<CheckInContract> {
  if (isMockEnabled('WS2')) {
    const item = localMockContracts.find((c) => c.id === id);
    if (!item) {
      throw new Error(`Không tìm thấy hợp đồng #${id}`);
    }
    return item;
  }

  try {
    const res = await apiClient<ApiResponse<any>>(`/contracts/${id}`);
    return mapBackendSummaryToCheckInContract(res.data);
  } catch (error) {
    console.warn(`Lỗi kết nối Backend API /contracts/${id}, fallback mock:`, error);
    const item = localMockContracts.find((c) => c.id === id);
    if (!item) {
      throw new Error(`Không tìm thấy hợp đồng #${id}`, { cause: error });
    }
    return item;
  }
}

/**
 * Nhân viên xác nhận bàn giao kho -> Kích hoạt hợp đồng ACTIVE, Unit OCCUPIED, cấp mã PIN 6 số
 * POST /api/v1/contracts/{id}/check-in
 */
export async function checkInContract(
  id: number,
  data: CheckInSubmitRequest,
  staffId?: number
): Promise<CheckInSubmitResponse> {
  if (isMockEnabled('WS2')) {
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    localMockContracts = localMockContracts.map((c) => {
      if (c.id === id) {
        return { ...c, status: 'ACTIVE', appointmentTime: '\u0110\u00e3 b\u00e0n giao xong' };
      }
      return c;
    });
    return {
      contractId: id,
      status: 'ACTIVE',
      checkinDate: data.checkinDate || new Date().toISOString().split('T')[0],
      accessCode: generatedPin,
    };
  }

  const headers: Record<string, string> = {};
  if (staffId) headers['X-Staff-Id'] = String(staffId);

  const res = await apiClient<ApiResponse<CheckInSubmitResponse>>(`/contracts/${id}/check-in`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      checkinDate: data.checkinDate,
      conditionNote: data.conditionNote,
      customerConfirmed: data.customerConfirmed,
      notes: data.notes,
      accessCardCode: data.accessCardCode,
    }),
  });
  return res.data;
}

/**
 * Xử lý ngoại lệ: Khách từ chối nhận kho hoặc phát hiện kho bị hư hỏng (BR-CHK-06, SCR-FS-02.1)
 * POST /api/v1/contracts/{id}/handover-rejection
 */
export async function rejectHandoverContract(
  id: number,
  data: HandoverRejectRequest,
  staffId?: number
): Promise<HandoverRejectResponse> {
  if (isMockEnabled('WS2')) {
    localMockContracts = localMockContracts.map((c) => {
      if (c.id === id) {
        return { ...c, status: 'TERMINATED', appointmentTime: 'T\u1eeb ch\u1ed1i nh\u1eadn kho (B\u1ea3o tr\u00ec)' };
      }
      return c;
    });
    return {
      contractId: id,
      status: 'TERMINATED',
      storageUnitStatus: 'MAINTENANCE',
      message: '\u0110\u00e3 ghi nh\u1eadn kh\u00e1ch t\u1eeb ch\u1ed1i nh\u1eadn kho v\u00e0 chuy\u1ec3n tr\u1ea1ng th\u00e1i b\u1ea3o tr\u00ec',
    };
  }

  const headers: Record<string, string> = {};
  if (staffId) headers['X-Staff-Id'] = String(staffId);

  // Kh\u00f4ng c\u00f3 catch silent \u2014 \u0111\u1ec3 l\u1ed7i propagate l\u00ean UI x\u1eed l\u00fd
  const res = await apiClient<ApiResponse<HandoverRejectResponse>>(
    `/contracts/${id}/handover-rejection`,
    { method: 'POST', headers, body: JSON.stringify(data) }
  );
  return res.data;
}

export function mapBackendSummaryToReturnContract(item: any): ReturnContractDetail {
  const rentalMonths = item.rentalMonths || 1;
  const totalFee = item.totalRentalFee || 0;
  const monthlyPrice = item.monthlyPrice || Math.round(totalFee / rentalMonths);
  const deposit = item.depositAmount || 0;

  return {
    id: item.id,
    code: item.code,
    customerId: item.customerId || 10,
    customerName: item.customerName || 'Khách hàng',
    customerPhone: item.customerPhone || '0967890123',
    customerIdentityNumber: item.customerIdentityNumber || '079099007890',
    facilityId: item.facilityId || 1,
    facilityName: item.facilityName || 'Cơ sở Quận 1 - TP.HCM',
    storageUnitId: item.storageUnitId || 1,
    storageUnitCode: item.storageUnitCode || 'Q1-A101',
    unitTypeName: item.unitTypeName || 'Kho Tiêu Chuẩn',
    startDate: item.startDate || new Date().toISOString().split('T')[0],
    endDateExclusive: item.endDate || item.endDateExclusive || new Date().toISOString().split('T')[0],
    rentalMonths: rentalMonths,
    monthlyPrice: monthlyPrice,
    depositAmount: deposit,
    status: item.status || 'PENDING_RETURN',
    returnNoticeDate: item.updatedAt ? item.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
    requestedReturnDate: item.returnDate || item.endDate || new Date().toISOString().split('T')[0],
  };
}

/**
 * Lấy danh sách hợp đồng chờ trả kho (Flow 3)
 */
export async function getReturnContracts(facilityId?: number): Promise<ReturnContractDetail[]> {
  if (isMockEnabled('WS2')) {
    let list = [...localMockReturnContracts];
    if (facilityId) list = list.filter((c) => c.facilityId === facilityId);
    return list;
  }

  const query = new URLSearchParams({ status: 'PENDING_RETURN', page: '0', size: '50' });
  if (facilityId && facilityId > 0) query.set('facilityIds', String(facilityId));

  const res = await apiClient<ApiResponse<PageResponse<any>>>(
    `/contracts?${query.toString()}`
  );
  const rawList = res.data?.content ?? [];
  return rawList.map(mapBackendSummaryToReturnContract);
}

/**
 * Lấy chi tiết hợp đồng chờ trả kho theo ID
 */
export async function getReturnContractById(id: number): Promise<ReturnContractDetail> {
  const item = localMockReturnContracts.find((c) => c.id === id);
  if (item && isMockEnabled('WS2')) return item;

  try {
    const res = await apiClient<ApiResponse<any>>(`/contracts/${id}`);
    return mapBackendSummaryToReturnContract(res.data);
  } catch (error) {
    console.warn(`Lỗi lấy hợp đồng #${id}, fallback mock:`, error);
    if (item) return item;
    throw new Error(`Không tìm thấy hợp đồng #${id}`, { cause: error });
  }
}

/**
 * Xem trước bảng quyết toán thanh lý hợp đồng (FM-04, BR-RET-04)
 * GET /api/v1/contracts/{id}/settlement-preview
 */
export async function getSettlementPreview(id: number): Promise<SettlementPreviewData> {
  if (isMockEnabled('WS2')) {
    const contract = localMockReturnContracts.find((c) => c.id === id);
    const deposit = contract ? contract.depositAmount : 1000000;
    return {
      contractId: id,
      depositAmount: deposit,
      damageCost: 0,
      overdueFee: 0,
      unpaidExtraCharges: 0,
      depositRefundAmount: deposit,
      payableAmount: 0,
    };
  }

  const res = await apiClient<ApiResponse<SettlementPreviewData>>(`/contracts/${id}/settlement-preview`);
  return res.data;
}

/**
 * Staff xác nhận nghiệm thu hiện trạng khi trả kho (FS-04)
 * POST /api/v1/contracts/{id}/return-inspections
 */
export async function submitReturnInspection(
  id: number,
  data: ReturnInspectionRequest,
  staffId?: number
): Promise<ReturnInspectionResponse> {
  if (isMockEnabled('WS2')) {
    const damageCost = data.damageCost || 0;
    const contract = localMockReturnContracts.find((c) => c.id === id);
    const deposit = contract ? contract.depositAmount : 1000000;
    const refund = Math.max(0, deposit - damageCost);
    localMockReturnContracts = localMockReturnContracts.filter((c) => c.id !== id);
    return { id, status: 'PENDING_RETURN', returnDate: data.returnDate, estimatedDepositRefund: refund, overdueFee: 0, damageCost };
  }

  const headers: Record<string, string> = {};
  if (staffId) headers['X-Staff-Id'] = String(staffId);

  const res = await apiClient<ApiResponse<ReturnInspectionResponse>>(`/contracts/${id}/return-inspections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      returnDate: data.returnDate,
      condition: data.condition,
      damageNotes: data.damageNotes,
      damageCost: data.damageCost,
      evidenceImageUrls: data.evidenceImageUrls,
    }),
  });
  return res.data;
}

/**
 * =====================================================================
 * CÁC HÀM DÀNH CHO FACILITY MANAGER CONTRACTS HUB (SCR-FM-02 / T3.12 / T4.2)
 * =====================================================================
 */

/**
 * Lấy danh sách hợp đồng cho Manager Hub (lọc theo cơ sở, trạng thái, từ khóa)
 */
export async function getManagerContracts(filter?: {
  facilityId?: number;
  status?: string;
  keyword?: string;
  nearExpiration?: boolean;
}): Promise<ManagerContractItem[]> {
  const params = new URLSearchParams();
  if (filter?.facilityId && filter.facilityId > 0) {
    params.append('facilityIds', filter.facilityId.toString());
  }
  if (filter?.status && filter.status !== 'ALL') {
    params.append('status', filter.status);
  }
  if (filter?.keyword) {
    params.append('keyword', filter.keyword.trim());
  }
  if (filter?.nearExpiration) {
    params.append('expiringSoon', 'true');
  }
  params.append('size', '50');

  try {
    const res = await apiClient<ApiResponse<PageResponse<ManagerContractItem>>>(
      `/contracts?${params.toString()}`
    );
    const items = res?.data?.content || [];
    return items.map((c: any) => {
      let daysRemaining: number | undefined;
      if (c.endDateExclusive) {
        try {
          const parts = String(c.endDateExclusive).split('-');
          if (parts.length === 3) {
            const end = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            daysRemaining = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
        } catch {
          daysRemaining = undefined;
        }
      }

      const nearExpiration =
        c.status === 'ACTIVE' &&
        daysRemaining !== undefined &&
        daysRemaining >= 0 &&
        daysRemaining <= 7;

      let overdueDays = c.overdueDays;
      if (overdueDays === undefined || overdueDays === null) {
        if (daysRemaining !== undefined && daysRemaining < 0) {
          overdueDays = Math.abs(daysRemaining);
        } else if (c.status === 'OVERDUE') {
          overdueDays = 1;
        }
      }

      let accruedOverdueFee = c.accruedOverdueFee;
      if (accruedOverdueFee === undefined && overdueDays !== undefined && overdueDays > 0) {
        const deposit = c.depositAmount || 0;
        if (overdueDays <= 3) {
          accruedOverdueFee = 0;
        } else if (overdueDays <= 10) {
          accruedOverdueFee = Math.round((overdueDays - 3) * 0.10 * deposit);
        } else {
          accruedOverdueFee = Math.round(0.70 * deposit);
        }
      }

      return {
        ...c,
        overdueDays,
        accruedOverdueFee,
        daysRemaining,
        nearExpiration: c.nearExpiration ?? nearExpiration,
      };
    });
  } catch (error) {
    console.error('Lỗi gọi API /contracts:', error);
    return [];
  }
}

/**
 * Tính toán các chỉ số KPI trên hàng thẻ Summary Cards
 */
export async function getManagerKpiData(facilityId?: number): Promise<ContractKpiData> {
  const contracts = await getManagerContracts({ facilityId, status: 'ALL' });
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
  const nearExpiring = activeContracts.filter(
    (c) =>
      c.nearExpiration ||
      (c.daysRemaining !== undefined && c.daysRemaining <= 7 && c.daysRemaining >= 0)
  );
  const pendingCheckIn = contracts.filter((c) => c.status === 'PENDING_CHECK_IN');
  const overdueContracts = contracts.filter((c) => c.status === 'OVERDUE');
  const pendingSettlement = contracts.filter(
    (c) =>
      c.status === 'INSPECTED' ||
      c.status === 'NOTICE_SUBMITTED' ||
      (c.status as string) === 'PENDING_RETURN'
  );

  const totalDebt = overdueContracts.reduce(
    (sum, c) => sum + (c.accruedOverdueFee || c.totalOutstandingDebt || c.overdueFeeAccrued || 0),
    0
  );

  return {
    activeCount: activeContracts.length,
    nearExpiringCount: nearExpiring.length,
    pendingCheckInCount: pendingCheckIn.length,
    overdueCount: overdueContracts.length,
    totalOverdueDebt: totalDebt,
    pendingSettlementCount: pendingSettlement.length,
  };
}

/**
 * Lấy danh sách các ô kho còn trống để đổi ô kho ngoại lệ (SCR-FM-02.2)
 */
export async function getAvailableUnitsForReassign(
  facilityId: number,
  unitTypeId: number
): Promise<AvailableUnitOption[]> {
  try {
    const res = await apiClient<PageResponse<any>>(
      `/facilities/${facilityId}/storage-units?unitTypeId=${unitTypeId}&status=AVAILABLE&size=50`
    );
    const items = res?.content || (res as any)?.data?.content || [];
    return items.map((u: any) => ({
      id: u.id,
      code: u.code,
      unitTypeId: u.unitTypeId,
      unitTypeName: u.unitTypeName,
      floor: u.floor,
      position: u.position,
      status: u.status,
    }));
  } catch (error) {
    console.error('Lỗi tải danh sách ô kho trống thay thế:', error);
    return [];
  }
}

/**
 * Đổi ô kho ngoại lệ cho hợp đồng/đơn đặt chỗ (SCR-FM-02.2)
 */
export async function reassignStorageUnit(
  data: ReassignUnitRequest
): Promise<{ success: boolean; message: string; updatedContract: ManagerContractItem }> {
  const res = await apiClient<ApiResponse<ManagerContractItem>>(
    `/contracts/${data.contractId}/reassign-unit`,
    {
      method: 'POST',
      body: JSON.stringify({
        newStorageUnitId: data.newUnitId,
        reason: data.reason,
      }),
    }
  );
  return {
    success: true,
    message: res.message || `Đổi ô kho sang ${data.newUnitCode} thành công`,
    updatedContract: res.data,
  };
}

/**
 * Lấy chi tiết công nợ và tình hình tài chính hợp đồng (FM-03)
 * GET /api/v1/contracts/{id}/financial-summary
 */
export async function getContractFinancialDetail(id: number): Promise<ContractFinancialSummary> {
  const res = await apiClient<ApiResponse<ContractFinancialSummary>>(
    `/contracts/${id}/financial-summary`
  );
  return res.data;
}

/**
 * Phê duyệt quyết toán thanh lý hợp đồng và kích hoạt hoàn cọc (FM-04, BR-RET-05)
 * POST /api/v1/contracts/{id}/settlement-approval
 */
export async function approveSettlementRefund(
  data: SettlementApprovalRequest,
  managerId?: number
): Promise<{ success: boolean; message: string }> {
  const headers: Record<string, string> = {};
  if (managerId) headers['X-Manager-Id'] = String(managerId);

  const res = await apiClient<ApiResponse<any>>(`/contracts/${data.contractId}/settlement-approval`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return {
    success: true,
    message: res.message || 'Phê duyệt quyết toán và hoàn cọc thành công',
  };
}
