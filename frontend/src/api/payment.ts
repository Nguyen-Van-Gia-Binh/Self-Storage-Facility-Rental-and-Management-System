import { apiClient } from './client';
import type {
  CreatePaymentRequest,
  PaymentTransaction,
  MoveInPassData,
} from '@/types';

// Key lưu trữ localStorage cho thanh toán và hợp đồng mới
const STORAGE_PAYMENTS_KEY = 'smartstorage_payments';
const STORAGE_USER_PASSES_KEY = 'smartstorage_move_in_passes';

export interface CheckoutPayload {
  referenceType?: 'RESERVATION' | 'CONTRACT_RENEWAL' | 'SETTLEMENT' | 'OVERDUE_PENALTY' | 'RESCHEDULE_FEE' | 'DIRECT_CONTRACT' | 'CONTRACT_INITIAL';
  referenceId?: number;
  reservationId?: number;
  contractRenewalId?: number;
  renewalMonths?: number;
  newStartDate?: string;
  amount?: number;
  description?: string;
  cancelUrl?: string;
  returnUrl?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  paymentId?: number;
  amount: number;
  description: string;
  accountName?: string;
  accountNumber?: string;
  bin?: string;
  status?: string;
}

export interface PaymentStatusResult {
  id: number;
  orderCode?: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'SUCCESS' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  paidAt?: string;
  referenceType: string;
  referenceId: number;
  transactionRef?: string;
}

export interface PaymentHistoryItem {
  id: number;
  referenceType: string;
  referenceId: number;
  amount: number;
  method: string;
  status: string;
  orderCode?: number;
  transactionRef?: string;
  paidAt?: string;
  createdAt?: string;
  facilityName?: string;
  customerName?: string;
}

export interface PaymentHistoryPage {
  content: PaymentHistoryItem[];
  page: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Lịch sử giao dịch toàn hệ thống cho BOM (GET /payments)
 */
export async function getPaymentHistory(params: {
  from?: string;
  to?: string;
  facilityId?: number;
  page: number;
  size?: number;
}): Promise<PaymentHistoryPage> {
  const query = new URLSearchParams({ page: String(params.page), size: String(params.size ?? 20) });
  if (params.from) query.append('from', params.from);
  if (params.to) query.append('to', params.to);
  if (params.facilityId != null) query.append('facilityId', String(params.facilityId));
  const res = await apiClient<PaymentHistoryPage | { data: PaymentHistoryPage }>(`/payments?${query.toString()}`);
  return 'data' in res ? res.data : res;
}

/**
 * Lấy danh sách giao dịch từ localStorage (hoặc mảng rỗng)
 */
export function getStoredPayments(): PaymentTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_PAYMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Lỗi đọc danh sách thanh toán từ localStorage:', err);
    return [];
  }
}

/**
 * Lưu giao dịch mới vào localStorage
 */
export function storePayment(payment: PaymentTransaction): void {
  try {
    const existing = getStoredPayments();
    localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify([payment, ...existing]));
  } catch (err) {
    console.error('Lỗi lưu giao dịch thanh toán:', err);
  }
}

/**
 * Lấy danh sách Thẻ nhận kho điện tử đã lưu
 */
export function getStoredMoveInPasses(): MoveInPassData[] {
  try {
    const raw = localStorage.getItem(STORAGE_USER_PASSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Lỗi đọc danh sách Thẻ nhận kho từ localStorage:', err);
    return [];
  }
}

/**
 * Lưu Thẻ nhận kho điện tử vào localStorage
 */
export function storeMoveInPass(pass: MoveInPassData): void {
  try {
    const existing = getStoredMoveInPasses();
    localStorage.setItem(STORAGE_USER_PASSES_KEY, JSON.stringify([pass, ...existing]));
  } catch (err) {
    console.error('Lỗi lưu Thẻ nhận kho:', err);
  }
}

/**
 * Khởi tạo đơn thanh toán VNPay Sandbox tự động (POST /payments/checkout) (SC-03)
 * Sử dụng 100% kết nối thật tới cổng VNPay Sandbox qua Backend API
 */
export async function createCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  const referenceType =
    payload.referenceType ||
    (payload.contractRenewalId ? 'CONTRACT_RENEWAL' : 'RESERVATION');
  const referenceId =
    payload.referenceId ||
    payload.contractRenewalId ||
    payload.reservationId ||
    1;

  const requestBody = {
    referenceType,
    referenceId,
    renewalMonths: payload.renewalMonths,
    newStartDate: payload.newStartDate,
    description: payload.description,
    cancelUrl: payload.cancelUrl,
    returnUrl: payload.returnUrl,
  };

  const res = await apiClient<any>('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  return (res && typeof res === 'object' && 'data' in res && res.data) ? res.data : res;
}

/**
 * Kiểm tra trạng thái giao dịch theo orderCode phục vụ Polling tự động (GET /payments/order/{orderCode}/status) (SC-03)
 * Truy vấn trạng thái thực tế từ Backend và VNPay Return Callback
 */
export async function pollPaymentStatus(orderCode: number): Promise<PaymentStatusResult> {
  const res = await apiClient<any>(`/payments/order/${orderCode}/status`);
  return (res && typeof res === 'object' && 'data' in res && res.data) ? res.data : res;
}


/**
 * Tạo yêu cầu thanh toán thủ công (POST /api/v1/payments) (SC-03)
 */
export async function createPayment(request: CreatePaymentRequest): Promise<PaymentTransaction> {
  return await apiClient<PaymentTransaction>('/payments', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Sinh mã Thẻ nhận kho điện tử (Move-in Pass) sau khi thanh toán thành công
 */
export function generateMoveInPass(data: Omit<MoveInPassData, 'passCode' | 'status'>): MoveInPassData {
  const passCode = `PASS-${data.unitNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
  const pass: MoveInPassData = {
    ...data,
    passCode,
    status: 'PENDING_CHECKIN',
  };
  storeMoveInPass(pass);
  return pass;
}
