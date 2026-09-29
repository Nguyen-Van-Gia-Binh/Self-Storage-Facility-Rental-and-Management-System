/**
 * Reservation API Client — WS1 (SC-01, SC-02, BR-DEP-01, BR-DEP-03, BR-GEN-04)
 * Quản lý tính giá trước, kiểm tra sức chứa và tạo đơn đặt chỗ giữ kho 48h.
 */
import { apiClient, type ApiResponse } from '@/api/client';

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

/**
 * 1. Tính toán trước tiền thuê, chiết khấu và cọc 1 tháng (BR-DEP-01, BR-GEN-04)
 */
export async function calculateBookingPrice(req: CalculatePriceRequest): Promise<CalculatePriceResponse> {
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
