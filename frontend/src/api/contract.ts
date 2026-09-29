import { apiClient } from './client';
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

/**
 * Ánh xạ dữ liệu ContractSummaryResponse từ Backend sang CheckInContract cho UI Staff
 */
export function mapBackendSummaryToCheckInContract(item: any): CheckInContract {
  if (!item) return item;

  const unitCode = item.storageUnitCode || '';
  const floor = Number(item.floor ?? 0);
  const zone = item.position || '';

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const startDateStr = item.startDate || '';
  let appointmentTime = item.appointmentTime || '';
  if (!appointmentTime && startDateStr) {
    if (startDateStr > todayStr) {
      appointmentTime = `Bắt đầu ${startDateStr}`;
    } else if (startDateStr < todayStr) {
      appointmentTime = `Ân hạn nhận kho từ ${startDateStr}`;
    } else {
      appointmentTime = `Bắt đầu ${startDateStr}`;
    }
  }

  const startDayTime = startDateStr ? new Date(startDateStr).getTime() : NaN;
  const nowDayTime = new Date(todayStr).getTime();
  const diffDays = Number.isFinite(startDayTime)
    ? Math.floor((nowDayTime - startDayTime) / (1000 * 3600 * 24))
    : 0;
  const graceDaysRemaining = startDateStr ? Math.max(0, 10 - diffDays) : 0;

  return {
    id: item.id,
    code: item.code || '',
    reservationId: item.reservationId,
    reservationCode: item.reservationCode || '',
    customerId: item.customerId,
    customerName: item.customerName || '',
    customerPhone: item.customerPhone || '',
    customerIdentityNumber: item.customerIdentityNumber || item.identityNumber || '',
    facilityId: item.facilityId,
    facilityName: item.facilityName || '',
    storageUnitId: item.storageUnitId,
    storageUnitCode: unitCode,
    floor: floor,
    position: item.position || `${zone} • Tầng ${floor}`,
    unitTypeId: item.unitTypeId || 1,
    unitTypeName: item.unitTypeName || 'Kho Tiêu Chuẩn',
    unitTypeDimensions: (() => {
      if (item.unitTypeDimensions && item.unitTypeDimensions !== '2.0m x 2.0m x 2.5m') {
        return item.unitTypeDimensions;
      }
      const typeName = (item.unitTypeName || '').toLowerCase();
      const code = (unitCode || '').toUpperCase();
      if (typeName.includes('nhỏ') || typeName.includes('small') || code.includes('-S')) {
        return '1.0m x 1.0m x 1.5m (Diện tích: 1m²)';
      } else if (typeName.includes('lớn') || typeName.includes('large') || code.includes('-L')) {
        return '3.0m x 3.0m x 2.8m (Diện tích: 9m²)';
      } else if (typeName.includes('lạnh') || typeName.includes('climate')) {
        return '2.0m x 2.5m x 2.5m (Diện tích: 5m²)';
      }
      return '2.0m x 2.0m x 2.5m (Diện tích: 4m²)';
    })(),
    startDate: item.startDate || todayStr,
    endDateExclusive: item.endDateExclusive || '',
    rentalMonths: item.rentalMonths || 0,
    monthlyPrice: item.monthlyPrice || 0,
    totalRentalFee: item.totalRentalFee || 0,
    depositAmount: item.depositAmount || 0,
    totalPayable: item.totalPayable || 0,
    isFullyPaid: item.isFullyPaid === true || item.status === 'PENDING_CHECK_IN',
    status: item.status || 'PENDING_CHECK_IN',
    appointmentTime: appointmentTime,
    graceDaysRemaining: graceDaysRemaining,
    assignedStaffId: item.assignedStaffId,
    assignedStaffName: item.assignedStaffName,
  };
}

/**
 * Lấy danh sách hợp đồng chờ Check-in tại quầy
 * Gọi GET /contracts?status=PENDING_CHECK_IN
 */
export async function getPendingContracts(facilityId?: number): Promise<CheckInContract[]> {
  const query = new URLSearchParams({ status: 'PENDING_CHECK_IN', page: '0', size: '50' });
  if (facilityId && facilityId > 0) {
    query.set('facilityId', String(facilityId));
    query.set('facilityIds', String(facilityId));
  }

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
  const res = await apiClient<ApiResponse<any>>(`/contracts/${id}`);
  return mapBackendSummaryToCheckInContract(res.data);
}

/**
 * Nhân viên xác nhận bàn giao kho -> Kích hoạt hợp đồng ACTIVE, Unit OCCUPIED, cấp mã PIN 6 số
 * POST /api/v1/contracts/{id}/check-in
 */
export async function checkInContract(
  id: number,
  data: CheckInSubmitRequest,
  _staffId?: number
): Promise<CheckInSubmitResponse> {
  const res = await apiClient<ApiResponse<CheckInSubmitResponse>>(`/contracts/${id}/check-in`, {
    method: 'POST',
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
  _staffId?: number
): Promise<HandoverRejectResponse> {
  const res = await apiClient<ApiResponse<HandoverRejectResponse>>(
    `/contracts/${id}/handover-rejection`,
    { method: 'POST', body: JSON.stringify(data) }
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
    customerId: item.customerId,
    customerName: item.customerName || '',
    customerPhone: item.customerPhone || '',
    customerIdentityNumber: item.customerIdentityNumber || item.identityNumber || '',
    facilityId: item.facilityId,
    facilityName: item.facilityName || '',
    storageUnitId: item.storageUnitId,
    storageUnitCode: item.storageUnitCode || '',
    unitTypeName: item.unitTypeName || 'Kho Tiêu Chuẩn',
    startDate: item.startDate || new Date().toISOString().split('T')[0],
    endDateExclusive: item.endDate || item.endDateExclusive || new Date().toISOString().split('T')[0],
    rentalMonths: rentalMonths,
    monthlyPrice: monthlyPrice,
    depositAmount: deposit,
    status: item.status || 'PENDING_RETURN',
    returnNoticeDate: item.updatedAt ? item.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
    requestedReturnDate: item.returnDate || item.endDate || new Date().toISOString().split('T')[0],
    assignedStaffId: item.assignedStaffId,
    assignedStaffName: item.assignedStaffName,
    assignmentStatus: item.assignedStaffId ? 'ASSIGNED' : 'UNASSIGNED',
    isInspected: Boolean(item.isInspected),
    damageCost: item.damageCost || 0,
    damageNotes: item.damageNotes || '',
  };
}

/**
 * Manager phân công nhân viên nghiệm thu trả kho (FM-05, FS-04)
 * PATCH /api/v1/contracts/{id}/assign-return
 */
export async function assignReturnStaff(
  contractId: number,
  staffId: number,
  notes?: string
): Promise<any> {
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/assign-return`, {
    method: 'PATCH',
    body: JSON.stringify({ staffId, notes }),
  });
  return res.data;
}

/**
 * Manager phân công nhân viên tiếp đón nhận kho Check-in (FM-05, FS-01)
 * PATCH /api/v1/contracts/{id}/assign-checkin
 */
export async function assignCheckInStaff(
  contractId: number,
  staffId: number,
  notes?: string
): Promise<any> {
  const res = await apiClient<ApiResponse<any>>(`/contracts/${contractId}/assign-checkin`, {
    method: 'PATCH',
    body: JSON.stringify({ staffId, notes }),
  });
  return res.data;
}

/**
 * Lấy danh sách hợp đồng chờ trả kho (Flow 3)
 */
export async function getReturnContracts(facilityId?: number): Promise<ReturnContractDetail[]> {
  const query = new URLSearchParams({ status: 'PENDING_RETURN', page: '0', size: '50' });
  if (facilityId && facilityId > 0) {
    query.set('facilityId', String(facilityId));
    query.set('facilityIds', String(facilityId));
  }

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
  const res = await apiClient<ApiResponse<any>>(`/contracts/${id}`);
  return mapBackendSummaryToReturnContract(res.data);
}

/**
 * Xem trước bảng quyết toán thanh lý hợp đồng (FM-04, BR-RET-04)
 * GET /api/v1/contracts/{id}/settlement-preview
 */
export async function getSettlementPreview(id: number): Promise<SettlementPreviewData> {
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
  _staffId?: number
): Promise<ReturnInspectionResponse> {
  const res = await apiClient<ApiResponse<ReturnInspectionResponse>>(`/contracts/${id}/return-inspections`, {
    method: 'POST',
    body: JSON.stringify({
      returnDate: data.returnDate,
      condition: data.condition,
      damageNotes: data.damageNotes,
      damageCost: data.damageCost,
      evidenceImageUrls: data.evidenceImageUrls,
      customerConfirmed: data.customerConfirmed,
      signatureDataUrl: data.signatureDataUrl,
    }),
  });
  return res.data;
}

/**
 * Hoàn tất dọn ô kho sau nghiệm thu: CLEANING → RESERVED hoặc AVAILABLE (BR-RET-09).
 * POST /api/v1/contracts/{id}/cleaning-complete
 */
export async function completeUnitCleaning(id: number): Promise<void> {
  await apiClient(`/contracts/${id}/cleaning-complete`, { method: 'POST' });
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
    params.append('facilityId', filter.facilityId.toString());
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

      let checkInGraceDaysRemaining: number | undefined;
      if (c.startDate) {
        try {
          const parts = String(c.startDate).split('-');
          if (parts.length === 3) {
            const start = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            // BR-CAN-04 / BR-CHK-05: Ân hạn nhận kho 10 ngày kể từ ngày bắt đầu hợp đồng (startDate)
            const deadline = new Date(start.getTime() + 10 * 24 * 60 * 60 * 1000);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            checkInGraceDaysRemaining = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
        } catch {
          checkInGraceDaysRemaining = undefined;
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

      const isInspected = Boolean(c.isInspected);
      let mappedStatus = c.status;
      if (c.status === 'PENDING_RETURN' && isInspected) {
        mappedStatus = 'INSPECTED';
      }

      return {
        ...c,
        status: mappedStatus,
        isInspected,
        inspectionCondition: isInspected ? (c.damageCost > 0 ? 'MINOR_DAMAGE' : 'GOOD') : undefined,
        damageCost: c.damageCost || 0,
        damageNotes: c.damageNotes || '',
        overdueDays,
        accruedOverdueFee,
        daysRemaining,
        checkInGraceDaysRemaining,
        nearExpiration: c.nearExpiration ?? nearExpiration,
        assignedStaffId: c.assignedStaffId,
        assignedStaffName: c.assignedStaffName,
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
  _managerId?: number
): Promise<{ success: boolean; message: string }> {
  const res = await apiClient<ApiResponse<any>>(`/contracts/${data.contractId}/settlement-approval`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    success: true,
    message: res.message || 'Phê duyệt quyết toán và hoàn cọc thành công',
  };
}
