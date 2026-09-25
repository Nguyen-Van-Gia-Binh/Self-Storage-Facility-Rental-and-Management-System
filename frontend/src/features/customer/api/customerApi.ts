import type { Facility, UnitType, StorageUnit, RentedContract, SupportTicket, CreateSupportTicketPayload } from '../types';
import { mockFacilities, mockUnitTypes, mockStorageUnits, mockRentedContracts, mockSupportTickets } from '../mockData';
import { calculateBookingTotal } from '../utils/pricing';
import type { PricingCalculationResult } from '../utils/pricing';
import { apiClient, type ApiResponse, isMockEnabled } from '@/api/client';
import { calculateBookingPrice, createReservation as apiCreateReservation } from '@/api/reservation';
import { getCustomerContracts } from '@/api/customerRentals';

let cachedTickets: SupportTicket[] = [...mockSupportTickets];

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
    try {
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
    } catch {
      // Giả lập kết quả trả về nếu backend offline
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const mockCode = `RSV-20260920-${randomSuffix}`;
      const pricing = calculateBookingTotal(1200000, payload.rentalMonths);
      const transferContent = `SMARTSTORAGE ${mockCode}`;

      return {
        code: mockCode,
        facilityName: 'SmartStorage District 7 Flagship',
        unitTypeName: 'Type S – Small Locker',
        totalPayable: pricing.totalDueToday,
        depositAmount: pricing.depositAmount,
        status: 'PENDING_PAYMENT',
        holdExpiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        vietQrPayload: `vietqr://${pricing.totalDueToday}/${transferContent}`,
        bankAccountNumber: '0888 567 999',
        bankName: 'MB Bank (Ngân hàng Quân Đội)',
        transferContent,
      };
    }
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
    try {
      const params = new URLSearchParams();
      if (status && status !== 'ALL') params.append('status', status);
      if (category && category !== 'ALL') params.append('category', category);
      
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient<ApiResponse<any>>(`/support-requests${queryStr}`);

      if (res?.data?.content && Array.isArray(res.data.content)) {
        return res.data.content;
      }
      if (Array.isArray(res?.data)) {
        return res.data;
      }
    } catch {
      // Fallback to cached mock data
    }

    let result = [...cachedTickets];
    if (status && status !== 'ALL') {
      result = result.filter(t => t.status === status);
    }
    if (category && category !== 'ALL') {
      result = result.filter(t => t.category === category);
    }
    return result;
  },

  /**
   * Xem chi tiết yêu cầu hỗ trợ (US-SC-06.2)
   */
  async getSupportRequestDetail(id: number): Promise<SupportTicket> {
    try {
      const res = await apiClient<ApiResponse<SupportTicket>>(`/support-requests/${id}`);
      if (res?.data) return res.data;
    } catch {
      // Fallback
    }

    const found = cachedTickets.find(t => t.id === id);
    if (!found) throw new Error('Không tìm thấy yêu cầu hỗ trợ');
    return found;
  },

  /**
   * Gửi yêu cầu hỗ trợ mới (US-SC-06.1, UC-F7-01)
   */
  async createSupportRequest(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
    try {
      const res = await apiClient<ApiResponse<SupportTicket>>('/support-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.data) {
        cachedTickets.unshift(res.data);
        return res.data;
      }
    } catch {
      // Fallback
    }

    const newId = Math.max(0, ...cachedTickets.map(t => t.id)) + 1;
    const randomCode = `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    
    // Tìm facility & contract info nếu có
    const contract = mockRentedContracts.find(c => String(c.id) === String(payload.contractId));
    const facility = mockFacilities.find(f => String(f.id) === String(payload.facilityId));

    const newTicket: SupportTicket = {
      id: newId,
      ticketCode: randomCode,
      customerId: 1,
      customerName: 'Xuân Nhi',
      customerPhone: '0988 776 655',
      contractId: payload.contractId,
      contractNumber: contract?.contractNumber || (payload.contractId ? `HD-SS-${payload.contractId}` : undefined),
      facilityId: payload.facilityId,
      facilityName: facility?.name || contract?.facilityName || 'SmartStorage Cơ sở chính',
      storageUnitId: payload.storageUnitId,
      unitNumber: contract?.unitNumber,
      category: payload.category,
      title: payload.title,
      isUrgent: payload.isUrgent,
      slaHours: payload.isUrgent ? 2 : 24,
      description: payload.description,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: (payload.attachmentUrls || []).map((url, idx) => ({
        id: Date.now() + idx,
        fileUrl: url,
        fileType: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
      })),
      resolutionAttachments: [],
    };

    cachedTickets.unshift(newTicket);
    return newTicket;
  },

  /**
   * Nghiệm thu đóng yêu cầu hoặc báo chưa hài lòng (US-SC-06.3, UC-F7-08)
   */
  async confirmResolution(id: number, satisfied: boolean, feedbackNotes?: string): Promise<SupportTicket> {
    try {
      const res = await apiClient<ApiResponse<SupportTicket>>(`/support-requests/${id}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify({ satisfied, feedbackNotes }),
      });

      if (res?.data) {
        const idx = cachedTickets.findIndex(t => t.id === id);
        if (idx !== -1) cachedTickets[idx] = res.data;
        return res.data;
      }
    } catch {
      // Fallback
    }

    const idx = cachedTickets.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Không tìm thấy yêu cầu hỗ trợ');

    const updated: SupportTicket = {
      ...cachedTickets[idx],
      status: satisfied ? 'CLOSED' : 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
      resolutionNote: satisfied 
        ? (cachedTickets[idx].resolutionNote || '') + (feedbackNotes ? `\n[Khách hàng xác nhận: ${feedbackNotes}]` : '\n[Khách hàng xác nhận hài lòng và đóng ticket]')
        : (cachedTickets[idx].resolutionNote || '') + `\n[Khách hàng báo chưa đạt: ${feedbackNotes || 'Cần xử lý lại'}]`,
    };
    cachedTickets[idx] = updated;
    return updated;
  },

  /**
   * Khách hàng hủy yêu cầu hỗ trợ khi còn ở trạng thái Mới (NEW)
   */
  async cancelSupportRequest(id: number): Promise<boolean> {
    try {
      await apiClient(`/support-requests/${id}`, {
        method: 'DELETE',
      });
      cachedTickets = cachedTickets.filter(t => t.id !== id);
      return true;
    } catch {
      // Fallback
    }

    const target = cachedTickets.find(t => t.id === id);
    if (target && target.status === 'NEW') {
      cachedTickets = cachedTickets.filter(t => t.id !== id);
      return true;
    }
    return false;
  },
};
