import type { Facility, UnitType, StorageUnit, RentedContract } from '../types';
import { mockFacilities, mockUnitTypes, mockStorageUnits, mockRentedContracts } from '../mockData';
import { calculateBookingTotal } from '../utils/pricing';
import type { PricingCalculationResult } from '../utils/pricing';

const API_BASE_URL = 'http://localhost:8080/api/v1';

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
  code: string;
  facilityName: string;
  unitTypeName: string;
  totalPayable: number;
  depositAmount: number;
  status: string;
  holdExpiresAt: string;
  vietQrPayload: string;
  bankAccountNumber: string;
  bankName: string;
  transferContent: string;
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
};
