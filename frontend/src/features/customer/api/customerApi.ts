import type { Facility, UnitType, StorageUnit, RentedContract, SupportTicket, CreateSupportTicketPayload } from '../types';
import { mockFacilities, mockUnitTypes, mockStorageUnits, mockRentedContracts } from '../mockData';
import { calculateBookingTotal } from '../utils/pricing';
import type { PricingCalculationResult } from '../utils/pricing';
import { apiClient, type ApiResponse, type PageResponse, isMockEnabled } from '@/api/client';
import { calculateBookingPrice, createReservation as apiCreateReservation } from '@/api/reservation';
import { getCustomerContracts } from '@/api/customerRentals';

export interface CreateReservationPayload {
  facilityId: number;
  unitTypeId: number;
  storageUnitId?: number;
  startDate: string;
  rentalMonths: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  identityNumber: string;
}

export interface ReservationResult {
  id?: number;
  code: string;
  facilityName: string;
  unitTypeName: string;
  totalPayable: number;
  depositAmount: number;
  status: string;
  holdExpiresAt: string;
  vietQrPayload?: string;
  bankAccountNumber?: string;
  bankName?: string;
  transferContent?: string;
}

export interface CheckoutRequest {
  referenceType: string;
  referenceId: number;
  renewalMonths?: number;
  description?: string;
}

export interface CheckoutResponse {
  orderCode: number;
  checkoutUrl: string;
  qrCode: string;
  amount: number;
  description: string;
  accountName: string;
  accountNumber: string;
  bin: string;
  status: string;
}

export interface PaymentStatusResponse {
  id: number;
  referenceType: string;
  referenceId: number;
  amount: number;
  status: string;
  orderCode: number;
  transactionRef?: string;
}

export const customerApi = {
  /**
   * Lấy danh sách chi nhánh cơ sở kho đang hoạt động
   */
  async getFacilities(): Promise<Facility[]> {
    if (isMockEnabled('WS1')) return mockFacilities;
    try {
      const res = await apiClient<ApiResponse<any>>('/facilities');
      if (res?.data?.content && Array.isArray(res.data.content)) {
        return res.data.content;
      }
      if (Array.isArray(res?.data)) {
        return res.data;
      }
    } catch {
      // Backend offline -> Fallback mock
    }
    return mockFacilities;
  },

  /**
   * Lấy danh mục 4 loại kích thước kho
   */
  async getUnitTypes(): Promise<UnitType[]> {
    if (isMockEnabled('WS1')) return mockUnitTypes;
    try {
      const res = await apiClient<ApiResponse<any>>('/facilities/1/unit-types');
      if (res?.data?.content && Array.isArray(res.data.content)) {
        return res.data.content;
      }
      if (Array.isArray(res?.data)) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return mockUnitTypes;
  },

  /**
   * Lấy danh sách ô kho và sơ đồ mặt bằng
   */
  async getStorageUnits(_facilityId: string): Promise<StorageUnit[]> {
    if (isMockEnabled('WS1')) return mockStorageUnits;
    try {
      const res = await apiClient<ApiResponse<any>>(`/public/facilities/${_facilityId}/units`);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return mockStorageUnits;
  },

  /**
   * Tính toán trước tiền thuê và tiền cọc theo BR-DEP-01 & BR-GEN-04
   */
  async calculatePrice(monthlyPrice: number, months: number): Promise<PricingCalculationResult> {
    try {
      const data = await calculateBookingPrice({ monthlyPrice, months });
      return {
        monthlyRate: data.monthlyPrice,
        months: data.rentalMonths,
        rawRentTotal: data.rawRentTotal,
        discountPercentage: data.discountPercentage,
        discountAmount: data.discountAmount,
        finalRentTotal: data.finalRentTotal,
        depositAmount: data.depositAmount,
        totalDueToday: data.totalDueToday,
      };
    } catch {
      return calculateBookingTotal(monthlyPrice, months);
    }
  },

  /**
   * Tạo đơn đặt chỗ mới & giữ chỗ 48h (SC-02)
   */
  async createReservation(payload: CreateReservationPayload): Promise<ReservationResult> {
    const res = await apiCreateReservation({
      facilityId: payload.facilityId,
      unitTypeId: payload.unitTypeId,
      storageUnitId: payload.storageUnitId,
      startDate: payload.startDate,
      rentalMonths: payload.rentalMonths,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      identityNumber: payload.identityNumber,
    });

    return {
      id: res.id,
      code: res.code,
      facilityName: res.facilityName || 'SmartStorage Cơ sở chính',
      unitTypeName: res.unitTypeName || 'Storage Locker',
      totalPayable: res.totalPayable || res.depositAmount,
      depositAmount: res.depositAmount,
      status: res.status,
      holdExpiresAt: res.holdExpiresAt,
      bankAccountNumber: res.bankAccountNumber,
      bankName: res.bankName,
      transferContent: res.transferContent,
      vietQrPayload: res.vietQrPayload,
    };
  },

  /**
   * Tạo link thanh toán PayOS VietQR tự động (SC-03)
   */
  async createPaymentCheckout(payload: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const res = await apiClient<ApiResponse<CheckoutResponse> | CheckoutResponse>('/payments/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return (res as any)?.data || res;
    } catch (err: any) {
      throw new Error(err?.message || 'Không thể tạo link thanh toán PayOS');
    }
  },

  /**
   * Tra cứu trạng thái giao dịch thanh toán theo orderCode phục vụ Polling tự động
   */
  async getPaymentStatus(orderCode: number): Promise<PaymentStatusResponse> {
    try {
      const res = await apiClient<ApiResponse<PaymentStatusResponse> | PaymentStatusResponse>(`/payments/order/${orderCode}/status`);
      return (res as any)?.data || res;
    } catch {
      throw new Error('Không thể tra cứu trạng thái thanh toán');
    }
  },

  /**
   * Xác nhận thanh toán giữ chỗ trực tiếp (SC-03) -> Bắn Event tạo RentalContract
   */
  async createManualPayment(payload: {
    referenceType: string;
    referenceId: number;
    amount: number;
    method: string;
    transactionRef?: string;
  }): Promise<any> {
    try {
      const res = await apiClient<ApiResponse<any> | any>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return (res as any)?.data || res;
    } catch (err: any) {
      throw new Error(err?.message || 'Không thể xác nhận giao dịch thanh toán');
    }
  },

  /**
   * Lấy danh sách hợp đồng kho đang thuê của khách hàng (SC-05)
   */
  async getMyRentals(): Promise<RentedContract[]> {
    try {
      const contracts = await getCustomerContracts();
      if (contracts && contracts.length > 0) {
        return contracts;
      }
    } catch {
      // Fallback
    }
    return mockRentedContracts;
  },

  /**
   * Lấy danh sách yêu cầu hỗ trợ sự cố của khách (SC-06, US-SC-06.2)
   */
  async getMySupportRequests(status?: string, category?: string): Promise<SupportTicket[]> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (category && category !== 'ALL') params.append('category', category);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<ApiResponse<PageResponse<SupportTicket>> | ApiResponse<SupportTicket[]>>(`/support-requests${queryStr}`);
    if ((res.data as any)?.content && Array.isArray((res.data as any).content)) {
      return (res.data as any).content;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  /**
   * Xem chi tiết yêu cầu hỗ trợ (US-SC-06.2)
   */
  async getSupportRequestDetail(id: number): Promise<SupportTicket> {
    const res = await apiClient<ApiResponse<SupportTicket>>(`/support-requests/${id}`);
    return res.data;
  },

  /**
   * Gửi yêu cầu hỗ trợ mới (US-SC-06.1, UC-F7-01)
   */
  async createSupportRequest(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
    const res = await apiClient<ApiResponse<SupportTicket>>('/support-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Nghiệm thu đóng yêu cầu hoặc báo chưa hài lòng (US-SC-06.3, UC-F7-08)
   */
  async confirmResolution(id: number, satisfied: boolean, feedbackNotes?: string): Promise<SupportTicket> {
    const res = await apiClient<ApiResponse<SupportTicket>>(`/support-requests/${id}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({ satisfied, feedbackNotes }),
    });
    return res.data;
  },

  /**
   * Khách hàng hủy yêu cầu hỗ trợ khi còn ở trạng thái Mới (NEW)
   */
  async cancelSupportRequest(id: number): Promise<boolean> {
    await apiClient<ApiResponse<void>>(`/support-requests/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
