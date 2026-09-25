/**
 * Reservation API Client — WS1 (SC-01, SC-02, BR-DEP-01, BR-DEP-03, BR-GEN-04)
 * Quản lý tính giá trước, kiểm tra sức chứa và tạo đơn đặt chỗ giữ kho 48h.
 */
import { apiClient, isMockEnabled, type ApiResponse } from '@/api/client';

export interface CalculatePriceRequest {
  monthlyPrice: number;
  months: number;
}

export interface CalculatePriceResponse {
  monthlyPrice: number;
  rentalMonths: number;
  rawRentTotal: number;
  discountPercentage: number;
  discountAmount: number;
  finalRentTotal: number;
  depositAmount: number;
  totalDueToday: number;
}

export interface CreateReservationRequest {
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

export interface ReservationResponse {
  id: number;
  code: string;
  facilityId: number;
  facilityName?: string;
  unitTypeId: number;
  unitTypeName?: string;
  storageUnitId?: number;
  storageUnitCode?: string;
  startDate: string;
  rentalMonths: number;
  endDateExclusive?: string;
  monthlyPrice: number;
  discountAmount: number;
  depositAmount: number;
  totalRentalFee: number;
  totalPayable: number;
  status: string;
  holdExpiresAt: string;
  vietQrPayload?: string;
  bankAccountNumber?: string;
  bankName?: string;
  transferContent?: string;
}

export interface AvailabilityResponse {
  facilityId: number;
  unitTypeId: number;
  startDate: string;
  endDateExclusive?: string;
  rentalMonths: number;
  availableSlots: number;
  monthlyPrice: number;
  totalRentalFee?: number;
  depositAmount: number;
}

// Mock fallback dự phòng khi bật cờ VITE_MOCK_WS1=true
function mockCalculatePrice(req: CalculatePriceRequest): CalculatePriceResponse {
  const rawTotal = req.monthlyPrice * req.months;
  let discountPercentage = 0;
  if (req.months >= 12) discountPercentage = 0.10;
  else if (req.months >= 6) discountPercentage = 0.05;

  const discountAmount = Math.round((rawTotal * discountPercentage) / 1000) * 1000;
  const finalRentTotal = rawTotal - discountAmount;
  const depositAmount = req.monthlyPrice; // BR-DEP-01
  const totalDueToday = finalRentTotal + depositAmount;

  return {
    monthlyPrice: req.monthlyPrice,
    rentalMonths: req.months,
    rawRentTotal: rawTotal,
    discountPercentage: discountPercentage * 100,
    discountAmount,
    finalRentTotal,
    depositAmount,
    totalDueToday,
  };
}

function mockCreateReservation(req: CreateReservationRequest): ReservationResponse {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const code = `RSV-202610-${randomSuffix}`;
  const pricing = mockCalculatePrice({ monthlyPrice: 1200000, months: req.rentalMonths });

  return {
    id: randomSuffix,
    code,
    facilityId: req.facilityId,
    facilityName: 'SmartStorage Tân Bình Flagship',
    unitTypeId: req.unitTypeId,
    unitTypeName: 'Kho Cỡ S – Tủ Đồ Cá Nhân',
    storageUnitId: req.storageUnitId,
    storageUnitCode: req.storageUnitId ? `U-${req.storageUnitId}` : 'U-101',
    startDate: req.startDate,
    rentalMonths: req.rentalMonths,
    monthlyPrice: 1200000,
    discountAmount: pricing.discountAmount,
    depositAmount: pricing.depositAmount,
    totalRentalFee: pricing.finalRentTotal,
    totalPayable: pricing.totalDueToday,
    status: 'PENDING_PAYMENT',
    holdExpiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    bankAccountNumber: '0888 567 999',
    bankName: 'MB Bank',
    transferContent: `SMARTSTORAGE ${code}`,
  };
}

/**
 * 1. Tính toán trước tiền thuê, chiết khấu và cọc 1 tháng (BR-DEP-01, BR-GEN-04)
 */
export async function calculateBookingPrice(req: CalculatePriceRequest): Promise<CalculatePriceResponse> {
  if (isMockEnabled('WS1')) {
    return mockCalculatePrice(req);
  }
  const res = await apiClient<ApiResponse<CalculatePriceResponse>>('/reservations/calculate-price', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return res.data;
}

/**
 * 2. Tạo đơn đặt chỗ mới & giữ chỗ 48h trên CSDL (SC-02, BR-RES-02, BR-DEP-03)
 */
export async function createReservation(req: CreateReservationRequest): Promise<ReservationResponse> {
  if (isMockEnabled('WS1')) {
    return mockCreateReservation(req);
  }
  const res = await apiClient<ApiResponse<ReservationResponse>>('/reservations', {
    method: 'POST',
    body: JSON.stringify(req),
  });
  return res.data;
}

/**
 * 3. Kiểm tra sức chứa và tính sẵn sàng của loại kho (SC-01, BR-AVL-01)
 */
export async function checkUnitAvailability(
  facilityId: number,
  unitTypeId: number,
  startDate: string,
  rentalMonths: number
): Promise<AvailabilityResponse> {
  if (isMockEnabled('WS1')) {
    return {
      facilityId,
      unitTypeId,
      startDate,
      rentalMonths,
      availableSlots: 8,
      monthlyPrice: 1200000,
      depositAmount: 1200000,
    };
  }
  const query = new URLSearchParams({
    startDate,
    rentalMonths: String(rentalMonths),
  });
  const res = await apiClient<any>(`/facilities/${facilityId}/unit-types/${unitTypeId}/availability?${query.toString()}`);
  return res?.data || res;
}

/**
 * 4. Tra cứu thông tin chi tiết đơn đặt chỗ theo mã Code
 */
export async function getReservationByCode(code: string): Promise<ReservationResponse> {
  if (isMockEnabled('WS1')) {
    return mockCreateReservation({
      facilityId: 1,
      unitTypeId: 1,
      startDate: new Date().toISOString().split('T')[0],
      rentalMonths: 3,
      customerName: 'Khách hàng',
      customerPhone: '0901234567',
      customerEmail: 'customer@example.com',
      identityNumber: '079204001234',
    });
  }
  const res = await apiClient<ApiResponse<ReservationResponse>>(`/reservations/${code}`);
  return res.data;
}
