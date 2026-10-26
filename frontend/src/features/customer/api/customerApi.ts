import type { Facility, RentedContract, SupportTicket, CreateSupportTicketPayload } from '../types';
import { apiClient, type ApiResponse, type PageResponse } from '@/api/client';
import { getCustomerContracts } from '@/api/customerRentals';
import { tokenStorage } from '@/utils/tokenStorage';

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

/**
 * Ánh xạ dữ liệu SupportRequest từ Backend sang SupportTicket cho UI Frontend
 */
export function mapBackendSupportRequest(item: any): SupportTicket {
  if (!item) return item;

  let attachments: any[] = [];
  if (Array.isArray(item.attachments)) {
    attachments = item.attachments;
  } else if (Array.isArray(item.attachmentUrls)) {
    attachments = item.attachmentUrls.map((url: string, idx: number) => ({
      id: idx + 1,
      fileUrl: url,
      fileType: url.endsWith('.png') ? 'image/png' : 'image/jpeg',
      uploadedAt: item.createdAt,
    }));
  }

  let resAttachments: any[] = [];
  if (Array.isArray(item.resolutionAttachments)) {
    resAttachments = item.resolutionAttachments;
  } else if (Array.isArray(item.resolutionAttachmentUrls)) {
    resAttachments = item.resolutionAttachmentUrls.map((url: string, idx: number) => ({
      id: idx + 1,
      fileUrl: url,
      fileType: url.endsWith('.png') ? 'image/png' : 'image/jpeg',
      uploadedAt: item.resolvedAt || item.updatedAt || item.createdAt,
    }));
  }

  return {
    id: item.id,
    ticketCode: item.code || item.ticketCode || `SUP-${item.id}`,
    customerId: item.customerId,
    customerName: item.customerName || (typeof window !== 'undefined' ? tokenStorage.getUser()?.fullName : '') || '',
    customerPhone: item.customerPhone || (typeof window !== 'undefined' ? (tokenStorage.getUser() as any)?.phone : '') || '',
    contractId: item.contractId,
    contractNumber: item.contractCode || item.contractNumber,
    facilityId: item.facilityId || 1,
    facilityName: item.facilityName || 'Cơ sở SmartStorage',
    storageUnitId: item.storageUnitId,
    unitNumber: item.storageUnitCode || item.unitNumber,
    category: item.category,
    title: item.title || item.categoryDisplayName,
    isUrgent: Boolean(item.isUrgent),
    slaHours: item.slaHours ?? (item.isUrgent ? 2 : 24),
    description: item.description || '',
    status: item.status,
    assignedStaffId: item.assignedStaffId,
    assignedStaffName: item.assignedStaffName,
    assignedStaffPhone: item.assignedStaffPhone,
    resolutionNote: item.resolutionNote,
    customerNotice: item.customerNotice,
    resolvedAt: item.resolvedAt,
    autoCloseDeadline: item.autoClosedAt || item.slaDueAt,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt,
    attachments: attachments,
    resolutionAttachments: resAttachments,
  };
}

export const customerApi = {
  /**
   * Lấy danh sách chi nhánh cơ sở kho đang hoạt động
   */
  async getFacilities(): Promise<Facility[]> {
    const res = await apiClient<any>('/facilities');
    const items = res?.content || res?.data?.content || res?.data;
    if (!Array.isArray(items)) return [];
    return items.map((f: any) => ({
      id: String(f.id),
      code: f.code || '',
      name: f.name,
      address: f.address || '',
      district: f.district || '',
      city: f.city || '',
      distance: f.distance || '',
      startingPrice: Number(f.lowestMonthlyPrice ?? f.startingPrice ?? 0),
      image: f.image || '',
      phone: f.phone || '',
    }));
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
   * Chuyển tiền mô phỏng qua Cổng Sandbox nội bộ
   */
  async processSandboxTransfer(orderCode: number, action: 'TRANSFER_SUCCESS' | 'TRANSFER_FAILED' | 'CANCEL' = 'TRANSFER_SUCCESS'): Promise<any> {
    try {
      const res = await apiClient<ApiResponse<any> | any>('/payments/sandbox/process-transfer', {
        method: 'POST',
        body: JSON.stringify({ orderCode, action }),
      });
      return (res as any)?.data || res;
    } catch (err: any) {
      throw new Error(err?.message || 'Không thể kết nối cổng thanh toán Sandbox');
    }
  },

  /**
   * Lấy danh sách hợp đồng kho đang thuê của khách hàng (SC-05)
   */
  async getMyRentals(): Promise<RentedContract[]> {
    const contracts = await getCustomerContracts();
    return contracts ?? [];
  },
  /**
   * Lấy danh sách yêu cầu hỗ trợ sự cố của khách (SC-06, US-SC-06.2)
   */
  async getMySupportRequests(status?: string, category?: string): Promise<SupportTicket[]> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (category && category !== 'ALL') params.append('category', category);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<ApiResponse<PageResponse<any>> | ApiResponse<any[]>>(`/support-requests${queryStr}`);
    if ((res.data as any)?.content && Array.isArray((res.data as any).content)) {
      return (res.data as any).content.map(mapBackendSupportRequest);
    }
    if (Array.isArray(res.data)) {
      return res.data.map(mapBackendSupportRequest);
    }
    return [];
  },

  /**
   * Xem chi tiết yêu cầu hỗ trợ (US-SC-06.2)
   */
  async getSupportRequestDetail(id: number): Promise<SupportTicket> {
    const res = await apiClient<ApiResponse<any>>(`/support-requests/${id}`);
    return mapBackendSupportRequest(res.data);
  },

  /**
   * Gửi yêu cầu hỗ trợ mới (US-SC-06.1, UC-F7-01)
   */
  async createSupportRequest(payload: CreateSupportTicketPayload): Promise<SupportTicket> {
    const res = await apiClient<ApiResponse<any>>('/support-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBackendSupportRequest(res.data);
  },

  /**
   * Nghiệm thu đóng yêu cầu hoặc báo chưa hài lòng (US-SC-06.3, UC-F7-08)
   */
  async confirmResolution(id: number, satisfied: boolean, feedbackNotes?: string): Promise<SupportTicket> {
    const res = await apiClient<ApiResponse<any>>(`/support-requests/${id}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({ satisfied, feedbackNotes }),
    });
    return mapBackendSupportRequest(res.data);
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
