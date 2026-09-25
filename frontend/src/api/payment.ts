import { apiClient, isMockEnabled } from './client';
import type {
  CreatePaymentRequest,
  PaymentTransaction,
  MoveInPassData,
} from '@/types';

// Key lưu trữ localStorage cho thanh toán và hợp đồng mới
const STORAGE_PAYMENTS_KEY = 'smartstorage_payments';
const STORAGE_USER_PASSES_KEY = 'smartstorage_move_in_passes';

export interface CheckoutPayload {
  reservationId?: number;
  contractRenewalId?: number;
  amount: number;
  description: string;
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

function mockCreateCheckout(payload: CheckoutPayload): CheckoutResult {
  const orderCode = Number(String(Date.now()).slice(-6));
  const qrData = `vietqr://${payload.amount}/SMARTSTORAGE-${orderCode}`;
  return {
    checkoutUrl: `https://pay.payos.vn/web/${orderCode}`,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`,
    orderCode,
    paymentId: orderCode,
    amount: payload.amount,
    description: payload.description,
    accountName: 'CONG TY CP SMARTSTORAGE VIETNAM',
    accountNumber: '0888567999',
    bin: '970422',
    status: 'PENDING',
  };
}

function mockPollPaymentStatus(orderCode: number): PaymentStatusResult {
  return {
    id: orderCode,
    orderCode,
    amount: 1200000,
    status: 'PAID',
    paidAt: new Date().toISOString(),
    referenceType: 'RESERVATION',
    referenceId: orderCode,
    transactionRef: `REF-${orderCode}`,
  };
}

/**
 * Khởi tạo đơn thanh toán PayOS VietQR tự động (POST /payments/checkout) (SC-03)
 */
export async function createCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
  if (isMockEnabled('WS3')) {
    return mockCreateCheckout(payload);
  }

  try {
    return await apiClient<CheckoutResult>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Lỗi gọi API /payments/checkout, fallback sang mock:', err);
    return mockCreateCheckout(payload);
  }
}

/**
 * Kiểm tra trạng thái giao dịch theo orderCode phục vụ Polling tự động (GET /payments/order/{orderCode}/status) (SC-03)
 */
export async function pollPaymentStatus(orderCode: number): Promise<PaymentStatusResult> {
  if (isMockEnabled('WS3')) {
    return mockPollPaymentStatus(orderCode);
  }

  return await apiClient<PaymentStatusResult>(`/payments/order/${orderCode}/status`);
}

/**
 * Tạo yêu cầu thanh toán thủ công (POST /api/v1/payments) (SC-03)
 */
export async function createPayment(request: CreatePaymentRequest): Promise<PaymentTransaction> {
  if (isMockEnabled('WS3')) {
    const transactionId = `TXN-${Date.now()}`;
    const txn: PaymentTransaction = {
      id: transactionId,
      referenceType: request.referenceType,
      referenceId: request.referenceId,
      amount: request.amount,
      rentalFee: Math.max(0, request.amount - (request.amount > 2000000 ? request.amount / 2 : 1200000)),
      depositAmount: request.amount > 2000000 ? request.amount / 2 : 1200000,
      method: request.method,
      status: 'PENDING',
      transactionRef: request.transactionRef || `REF${Math.floor(100000 + Math.random() * 900000)}`,
      unitNumber: typeof request.referenceId === 'string' ? request.referenceId : `U-${request.referenceId}`,
      facilityName: 'SmartStorage Cơ sở mẫu',
    };
    storePayment(txn);
    return txn;
  }

  try {
    return await apiClient<PaymentTransaction>('/payments', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  } catch (err) {
    console.warn('Lỗi gọi API /payments, chuyển sang mock fallback:', err);
    const txn: PaymentTransaction = {
      id: `TXN-${Date.now()}`,
      referenceType: request.referenceType,
      referenceId: request.referenceId,
      amount: request.amount,
      rentalFee: Math.round(request.amount * 0.75),
      depositAmount: Math.round(request.amount * 0.25),
      method: request.method,
      status: 'PENDING',
      transactionRef: request.transactionRef || `REF${Date.now()}`,
      unitNumber: String(request.referenceId),
      facilityName: 'SmartStorage Cơ sở mẫu',
    };
    storePayment(txn);
    return txn;
  }
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
