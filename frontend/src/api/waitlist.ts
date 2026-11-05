import { apiClient } from './client';
import type {
  CreateWaitlistRequest,
  ConvertWaitlistRequest,
  RejectWaitlistRequest,
  FollowUpWaitlistRequest,
  WaitlistResponse,
} from '@/types/waitlist';

export async function registerWaitlist(data: CreateWaitlistRequest): Promise<WaitlistResponse> {
  const res = await apiClient<WaitlistResponse>('/waitlists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
}

export async function fetchMyWaitlists(): Promise<WaitlistResponse[]> {
  const res = await apiClient<WaitlistResponse[]>('/waitlists/my');
  return res;
}

export async function extendWaitlist(id: number): Promise<WaitlistResponse> {
  const res = await apiClient<WaitlistResponse>(`/waitlists/${id}/extend`, {
    method: 'PATCH',
  });
  return res;
}

export async function cancelWaitlist(id: number): Promise<WaitlistResponse> {
  const res = await apiClient<WaitlistResponse>(`/waitlists/${id}`, {
    method: 'DELETE',
  });
  return res;
}

export async function fetchFacilityWaitlists(facilityId: number): Promise<WaitlistResponse[]> {
  const res = await apiClient<WaitlistResponse[]>(`/facilities/${facilityId}/waitlists`);
  return res;
}

export async function startContacting(id: number): Promise<WaitlistResponse> {
  const res = await apiClient<WaitlistResponse>(`/waitlists/${id}/start-contacting`, {
    method: 'PATCH',
  });
  return res;
}

export async function convertWaitlistToReservation(
  id: number,
  data?: ConvertWaitlistRequest
): Promise<WaitlistResponse> {
  const res = await apiClient<WaitlistResponse>(`/waitlists/${id}/convert-to-reservation`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  });
  return res;
}

export async function rejectWaitlist(id: number, data: RejectWaitlistRequest): Promise<WaitlistResponse> {
  const res = await apiClient<WaitlistResponse>(`/waitlists/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res;
}

export async function followUpWaitlist(id: number, data: FollowUpWaitlistRequest): Promise<WaitlistResponse> {
  const res = await apiClient<WaitlistResponse>(`/waitlists/${id}/follow-up`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res;
}

