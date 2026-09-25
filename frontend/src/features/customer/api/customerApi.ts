import type { Facility, UnitType, StorageUnit, RentedContract, SupportTicket, CreateSupportTicketPayload } from '../types';
import { mockFacilities, mockUnitTypes, mockStorageUnits, mockRentedContracts, mockSupportTickets } from '../mockData';
import { calculateBookingTotal } from '../utils/pricing';
import type { PricingCalculationResult } from '../utils/pricing';

const API_BASE_URL = 'http://localhost:8080/api/v1';

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
  method: string;
  status: string;
  transactionRef?: string;
  orderCode: number;
  checkoutUrl?: string;
  transferContent?: string;
  bankName?: string;
  bankAccountNumber?: string;
}

/**
 * Customer API Service for Workstream 1
 * Hỗ trợ gọi API Backend Spring Boot và tự động Fallback sang Mock Data nếu server chưa khởi động.
 */
export const customerApi = {
  /**
   * Lấy danh sách cơ sở lưu trữ
   */
  async getFacilities(): Promise<Facility[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/public/facilities`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
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
    try {
      const res = await fetch(`${API_BASE_URL}/public/unit-types`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
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
    try {
      const res = await fetch(`${API_BASE_URL}/public/facilities/${_facilityId}/units`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
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
      const res = await fetch(`${API_BASE_URL}/reservations/calculate-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyPrice, months }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return {
            monthlyRate: json.data.monthlyPrice,
            months: json.data.rentalMonths,
            rawRentTotal: json.data.rawRentTotal,
            discountPercentage: json.data.discountPercentage,
            discountAmount: json.data.discountAmount,
            finalRentTotal: json.data.finalRentTotal,
            depositAmount: json.data.depositAmount,
            totalDueToday: json.data.totalDueToday,
          };
        }
      }
    } catch {
      // Fallback logic
    }
    return calculateBookingTotal(monthlyPrice, months);
  },

  /**
   * Tạo đơn đặt chỗ mới & giữ chỗ 48h
   */
  async createReservation(payload: CreateReservationPayload): Promise<ReservationResult> {
    try {
      const res = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return json.data;
        }
      }
    } catch {
      // Fallback logic
    }

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
  },

  /**
   * Tạo link thanh toán PayOS VietQR tự động (SC-03)
   */
  async createPaymentCheckout(payload: CheckoutRequest): Promise<CheckoutResponse> {
    const res = await fetch(`${API_BASE_URL}/payments/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể tạo link thanh toán PayOS');
    }
    return res.json();
  },

  /**
   * Tra cứu trạng thái giao dịch thanh toán theo orderCode phục vụ Polling tự động
   */
  async getPaymentStatus(orderCode: number): Promise<PaymentStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/payments/order/${orderCode}/status`, {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error('Không thể tra cứu trạng thái thanh toán');
    }
    return res.json();
  },

  /**
   * Xác nhận thanh toán giữ chỗ trực tiếp (SC-03) -> Bắn Event tạo RentalContract
   * POST /api/v1/payments
   */
  async createManualPayment(payload: {
    referenceType: string;
    referenceId: number;
    amount: number;
    method: string;
    transactionRef?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || 'Không thể xác nhận giao dịch thanh toán');
    }
    return res.json();
  },

  /**
   * Lấy danh sách hợp đồng kho đang thuê của khách hàng
   */
  async getMyRentals(): Promise<RentedContract[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/reservations/my-rentals`, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          return json.data;
        }
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
      
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/support-requests?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data.content)) {
          return json.data.content;
        }
        if (json.data && Array.isArray(json.data)) {
          return json.data;
        }
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
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/support-requests/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
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
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/support-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          cachedTickets.unshift(json.data);
          return json.data;
        }
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
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/support-requests/${id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ satisfied, feedbackNotes }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const idx = cachedTickets.findIndex(t => t.id === id);
          if (idx !== -1) cachedTickets[idx] = json.data;
          return json.data;
        }
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
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/support-requests/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        cachedTickets = cachedTickets.filter(t => t.id !== id);
        return true;
      }
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
