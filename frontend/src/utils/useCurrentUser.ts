import { useMemo } from 'react';
import { tokenStorage } from './tokenStorage';
import type { UserSession } from './tokenStorage';

/**
 * Hook lấy thông tin người dùng hiện tại từ localStorage session.
 * Không re-render khi token thay đổi — chỉ dùng để lấy ID/role tại mount time.
 */
export function useCurrentUser(): UserSession | null {
  return useMemo(() => tokenStorage.getUser(), []);
}
