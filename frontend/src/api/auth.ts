/**
 * Authentication API Client — T2.3, T2.12
 * Kết nối /auth/login, /auth/register và xử lý lưu phiên JWT token
 */
import { apiClient } from './client';
import type { ApiResponse } from './client';
import type { UserRoleType } from './user';
import mockUsers from '@/mock/mock-users.json';

export interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: UserRoleType;
  facilityIds?: number[];
}

export interface AuthData {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

/**
 * Đăng nhập người dùng: Ưu tiên gọi trực tiếp Backend Spring Boot (/api/v1/auth/login)
 * Nếu backend trả về lỗi xác thực (400, 401, 403) thì hiển thị đúng thông báo từ backend.
 * Nếu không kết nối được backend (offline) thì fallback sang chế độ demo.
 */
export async function loginUser(payload: LoginPayload): Promise<AuthData> {
  try {
    const res = await apiClient<ApiResponse<AuthData> | AuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const authData = ('data' in res && res.data) ? res.data : (res as AuthData);
    saveSession(authData);
    return authData;
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };

    // Nếu là lỗi từ Backend (400, 401, 403, 404, 409), ném lỗi để UI hiển thị thông báo thật từ server
    if (error && error.status && [400, 401, 403, 404, 409].includes(error.status)) {
      throw error;
    }

    console.warn('Backend chưa sẵn sàng hoặc lỗi mạng, tự động kích hoạt Mock Demo:', err);

    // Fallback Mock nếu backend offline
    const found = mockUsers.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (found) {
      const authData: AuthData = {
        accessToken: `mock-jwt-token-${found.id}-${Date.now()}`,
        refreshToken: `mock-refresh-token-${found.id}`,
        tokenType: 'Bearer',
        expiresIn: 900000,
        user: {
          id: found.id,
          email: found.email,
          fullName: found.fullName,
          phone: found.phone,
          role: found.role as UserRoleType,
          facilityIds: found.facilityIds,
        },
      };
      saveSession(authData);
      return authData;
    }

    const fallbackRole: UserRoleType = payload.email.includes('admin')
      ? 'SYSTEM_ADMINISTRATOR'
      : payload.email.includes('staff')
      ? 'FACILITY_STAFF'
      : payload.email.includes('manager') || payload.email.includes('fm')
      ? 'FACILITY_MANAGER'
      : payload.email.includes('bom')
      ? 'BUSINESS_OPERATIONS_MANAGER'
      : 'STORAGE_CUSTOMER';

    const fallbackAuth: AuthData = {
      accessToken: `mock-jwt-token-custom-${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 900000,
      user: {
        id: 999,
        email: payload.email,
        fullName: payload.email.split('@')[0],
        phone: '0909999999',
        role: fallbackRole,
        facilityIds: [1],
      },
    };
    saveSession(fallbackAuth);
    return fallbackAuth;
  }
}


/**
 * Lưu token và thông tin user vào localStorage
 */
export function saveSession(authData: AuthData): void {
  localStorage.setItem('access_token', authData.accessToken);
  if (authData.refreshToken) {
    localStorage.setItem('refresh_token', authData.refreshToken);
  }
  localStorage.setItem('user_role', authData.user.role);
  localStorage.setItem('current_user', JSON.stringify(authData.user));
}

/**
 * Đăng xuất
 */
export function logoutUser(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('current_user');
}

/**
 * Lấy đường dẫn portal phù hợp với role của user
 */
export function getPortalUrlByRole(role: UserRoleType): string {
  switch (role) {
    case 'SYSTEM_ADMINISTRATOR':
      return '/admin';
    case 'BUSINESS_OPERATIONS_MANAGER':
      return '/bom';
    case 'FACILITY_MANAGER':
      return '/manager';
    case 'FACILITY_STAFF':
      return '/staff';
    case 'STORAGE_CUSTOMER':
    default:
      return '/customer';
  }
}
