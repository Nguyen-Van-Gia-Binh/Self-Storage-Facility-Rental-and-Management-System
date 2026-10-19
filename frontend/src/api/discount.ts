/**
 * Discount Program API — BM-03 (UC-F4-09)
 * Quản lý chương trình khuyến mãi, ưu đãi giảm giá
 */
import { apiClient } from './client';
import type { PageResponse } from './client';

export interface DiscountProgramItem {
  id: number;
  name: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  minRentalMonths: number;
  startDate: string;
  endDate: string;
  scopeType: 'SYSTEM' | 'FACILITY' | 'UNIT_TYPE';
  facilityId?: number | null;
  facilityName?: string | null;
  unitTypeId?: number | null;
  unitTypeName?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDiscountProgramPayload {
  name: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  minRentalMonths: number;
  startDate: string;
  endDate: string;
  scopeType: 'SYSTEM' | 'FACILITY' | 'UNIT_TYPE';
  facilityId?: number | null;
  unitTypeId?: number | null;
}

export interface UpdateDiscountProgramPayload extends CreateDiscountProgramPayload {
  isActive?: boolean;
}

export async function fetchDiscountPrograms(params?: {
  isActive?: boolean;
  page?: number;
  size?: number;
}): Promise<PageResponse<DiscountProgramItem>> {
  const query = new URLSearchParams();
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  const queryString = query.toString();
  return await apiClient<PageResponse<DiscountProgramItem>>(
    `/discount-programs${queryString ? `?${queryString}` : ''}`
  );
}

export async function createDiscountProgram(
  payload: CreateDiscountProgramPayload
): Promise<DiscountProgramItem> {
  return await apiClient<DiscountProgramItem>('/discount-programs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDiscountProgram(
  id: number,
  payload: UpdateDiscountProgramPayload
): Promise<DiscountProgramItem> {
  return await apiClient<DiscountProgramItem>(`/discount-programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteDiscountProgram(id: number): Promise<void> {
  await apiClient<void>(`/discount-programs/${id}`, {
    method: 'DELETE',
  });
}
