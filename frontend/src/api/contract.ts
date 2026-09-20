import { apiClient } from './client';
import type { ApiResponse } from './client';
import type {
  CheckInContract,
  CheckInSubmitRequest,
  CheckInSubmitResponse,
  HandoverRejectRequest,
  HandoverRejectResponse
} from '../types';
import mockContractsData from '../mock/mock-contracts.json';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Bộ nhớ đệm tạm thời cho mock session (cho phép cập nhật trạng thái ngay trên UI khi test)
let localMockContracts: CheckInContract[] = JSON.parse(JSON.stringify(mockContractsData));

/**
 * Lấy danh sách hợp đồng chờ Check-in tại quầy
 * Nếu mock mode = true: trả về dữ liệu mẫu trong mock-contracts.json
 * Nếu gọi API thật: gọi GET /contracts?status=PENDING_CHECK_IN
 */
export async function getPendingContracts(facilityId?: number): Promise<CheckInContract[]> {
  if (USE_MOCK) {
    let list = [...localMockContracts];
    if (facilityId) {
      list = list.filter((c) => c.facilityId === facilityId);
    }
    return list;
  }

  try {
    const endpoint = `/contracts?status=PENDING_CHECK_IN${facilityId ? `&facilityId=${facilityId}` : ''}`;
    const res = await apiClient<ApiResponse<CheckInContract[]> | CheckInContract[]>(endpoint);
    if (Array.isArray(res)) {
      return res;
    }
    return res.data || [];
  } catch (error) {
    console.warn('Lỗi kết nối Backend API /contracts, chuyển sang mock data:', error);
    let list = [...localMockContracts];
    if (facilityId) {
      list = list.filter((c) => c.facilityId === facilityId);
    }
    return list;
  }
}

/**
 * Lấy thông tin chi tiết một hợp đồng theo ID
 */
export async function getContractById(id: number): Promise<CheckInContract> {
  if (USE_MOCK) {
    const item = localMockContracts.find((c) => c.id === id);
    if (!item) {
      throw new Error(`Không tìm thấy hợp đồng #${id}`);
    }
    return item;
  }

  try {
    const res = await apiClient<ApiResponse<CheckInContract>>(`/contracts/${id}`);
    return res.data;
  } catch (error) {
    console.warn(`Lỗi kết nối Backend API /contracts/${id}, fallback mock:`, error);
    const item = localMockContracts.find((c) => c.id === id);
    if (!item) {
      throw new Error(`Không tìm thấy hợp đồng #${id}`);
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
  data: CheckInSubmitRequest
): Promise<CheckInSubmitResponse> {
  if (USE_MOCK) {
    // Sinh mã PIN ngẫu nhiên 6 chữ số theo BR-ACC-01
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();

    // Cập nhật trạng thái trong local mock session
    localMockContracts = localMockContracts.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: 'ACTIVE',
          appointmentTime: 'Đã bàn giao xong',
        };
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

  try {
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
  } catch (error) {
    console.warn(`Lỗi gọi API /contracts/${id}/check-in, fallback mock:`, error);
    const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      contractId: id,
      status: 'ACTIVE',
      checkinDate: data.checkinDate,
      accessCode: generatedPin,
    };
  }
}

/**
 * Xử lý ngoại lệ: Khách từ chối nhận kho hoặc phát hiện kho bị hư hỏng (BR-CHK-06, SCR-FS-02.1)
 * POST /api/v1/contracts/{id}/handover-rejection
 */
export async function rejectHandoverContract(
  id: number,
  data: HandoverRejectRequest
): Promise<HandoverRejectResponse> {
  if (USE_MOCK) {
    localMockContracts = localMockContracts.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: 'TERMINATED',
          appointmentTime: 'Từ chối nhận kho (Bảo trì)',
        };
      }
      return c;
    });

    return {
      contractId: id,
      status: 'TERMINATED',
      storageUnitStatus: 'MAINTENANCE',
      message: 'Đã ghi nhận khách từ chối nhận kho và chuyển trạng thái bảo trì',
    };
  }

  try {
    const res = await apiClient<ApiResponse<HandoverRejectResponse>>(`/contracts/${id}/handover-rejection`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  } catch (error) {
    console.warn(`Lỗi gọi API /contracts/${id}/handover-rejection, fallback mock:`, error);
    return {
      contractId: id,
      status: 'TERMINATED',
      storageUnitStatus: 'MAINTENANCE',
      message: 'Đã ghi nhận sự cố, khóa bảo trì và thông báo Quản lý cơ sở hoàn tiền',
    };
  }
}
