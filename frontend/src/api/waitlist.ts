import { apiClient, type ApiResponse } from './client';
import type {
  CreateWaitlistRequest,
  ConvertWaitlistRequest,
  RejectWaitlistRequest,
  FollowUpWaitlistRequest,
  WaitlistResponse,
} from '@/types/waitlist';

function unwrap<T>(res: ApiResponse<T> | T): T {
  return res && typeof res === 'object' && 'data' in res ? (res as ApiResponse<T>).data : (res as T);
}

function unwrapList<T>(res: ApiResponse<T[]> | T[]): T[] {
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}

export async function registerWaitlist(data: CreateWaitlistRequest): Promise<WaitlistResponse> {
  const res = await apiClient<ApiResponse<WaitlistResponse>>('/waitlists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return unwrap(res);
}

export async function fetchMyWaitlists(): Promise<WaitlistResponse[]> {
  const res = await apiClient<ApiResponse<WaitlistResponse[]>>('/waitlists/my');
  return unwrapList(res);
}

export async function extendWaitlist(id: number): Promise<WaitlistResponse> {
  const res = await apiClient<ApiResponse<WaitlistResponse>>(`/waitlists/${id}/extend`, {
    method: 'PATCH',
  });
  return unwrap(res);
}

export async function cancelWaitlist(id: number): Promise<WaitlistResponse> {
  const res = await apiClient<ApiResponse<WaitlistResponse>>(`/waitlists/${id}`, {
    method: 'DELETE',
  });
  return unwrap(res);
}

export async function fetchFacilityWaitlists(facilityId: number): Promise<WaitlistResponse[]> {
  const res = await apiClient<ApiResponse<WaitlistResponse[]>>(`/facilities/${facilityId}/waitlists`);
  return unwrapList(res);
}

export async function startContacting(id: number): Promise<WaitlistResponse> {
  const res = await apiClient<ApiResponse<WaitlistResponse>>(`/waitlists/${id}/start-contacting`, {
    method: 'PATCH',
  });
  return unwrap(res);
}

export async function convertWaitlistToReservation(
  id: number,
  data?: ConvertWaitlistRequest
): Promise<WaitlistResponse> {
  const res = await apiClient<ApiResponse<WaitlistResponse>>(`/waitlists/${id}/convert-to-reservation`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  });
  return unwrap(res);
}

export async function rejectWaitlist(id: number, data: RejectWaitlistRequest): Promise<WaitlistResponse> {
  const res = await apiClient<ApiResponse<WaitlistResponse>>(`/waitlists/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return unwrap(res);
}

export async function followUpWaitlist(id: number, data: FollowUpWaitlistRequest): Promise<WaitlistResponse> {
  const res = await apiClient<ApiResponse<WaitlistResponse>>(`/waitlists/${id}/follow-up`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return unwrap(res);
}

