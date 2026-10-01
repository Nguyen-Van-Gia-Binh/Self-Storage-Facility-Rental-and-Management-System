/**
 * Reservation API Client — WS1 (SC-01, SC-02, BR-DEP-01, BR-DEP-03, BR-GEN-04)
 * Quản lý tính giá trước, kiểm tra sức chứa và tạo đơn đặt chỗ giữ kho 48h.
 */
import { apiClient, type ApiResponse } from '@/api/client';

export interface CalculatePriceRequest {
  facilityId: number;
  unitTypeId: number;
  months: number;
}

export interface SurchargeLine {
  name: string;
  amount: number;
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
  surcharges?: SurchargeLine[];
  surchargeTotal?: number;
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
  surcharges?: SurchargeLine[];
  surchargeTotal?: number;
}

/**
 * 1. Tính toán trước tiền thuê, chiết khấu và cọc 1 tháng (BR-DEP-01, BR-GEN-04)
 */
export async function calculateBookingPrice(req: CalculatePriceRequest): Promise<CalculatePriceResponse> {
  const res = await apiClient<ApiResponse<CalculatePriceResponse> | CalculatePriceResponse>(
    '/reservations/calculate-price',
    {
      method: 'POST',
      body: JSON.stringify(req),
    }
  );
  const wrapped = res as ApiResponse<CalculatePriceResponse>;
  const payload =
    wrapped?.data && typeof wrapped.data.monthlyPrice === 'number'
      ? wrapped.data
      : (res as CalculatePriceResponse);
  if (!payload || typeof payload.monthlyPrice !== 'number' || payload.monthlyPrice <= 0) {
    throw new Error('Báo giá không có đơn giá');
  }
  return payload;
}

/**
 * 2. Tạo đơn đặt chỗ mới & giữ chỗ 48h trên CSDL (SC-02, BR-RES-02, BR-DEP-03)
 */
export async function createReservation(req: CreateReservationRequest): Promise<ReservationResponse> {
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
  const res = await apiClient<ApiResponse<ReservationResponse>>(`/reservations/${code}`);
  return res.data;
}

/**
 * 5. Hủy đơn đặt chỗ kèm lý do (BR-RES-04, API-SPEC § 7.4)
 */
export async function cancelReservationApi(id: number, reason?: string): Promise<ReservationResponse> {
  const res = await apiClient<ApiResponse<ReservationResponse>>(`/reservations/${id}/cancellation`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'Khách hàng hủy giữ chỗ trên trang thanh toán' }),
  });
  return res.data;
}

