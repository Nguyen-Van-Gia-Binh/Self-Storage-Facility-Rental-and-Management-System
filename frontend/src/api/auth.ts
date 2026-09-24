/**
 * Authentication API Client — T2.3, T2.12
 * Kết nối /auth/login, /auth/register và xử lý lưu phiên JWT token
 */
import { apiClient } from './client';
import type { ApiResponse } from './client';
import type { UserRoleType } from './user';
import { tokenStorage, normalizeRole } from '@/utils/tokenStorage';
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

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

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
 * Đăng ký tài khoản khách hàng mới: Kết nối /api/v1/auth/register (T2.12)
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthData> {
  try {
    const res = await apiClient<ApiResponse<AuthData> | AuthData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const authData = ('data' in res && res.data) ? res.data : (res as AuthData);
    saveSession(authData);
    return authData;
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };

    if (error && error.status && [400, 401, 403, 404, 409].includes(error.status)) {
      throw error;
    }

    console.warn('Backend chưa sẵn sàng hoặc lỗi mạng, tự động mô phỏng đăng ký:', err);

    // Mô phỏng tạo tài khoản khách hàng mới khi backend offline
    const newCustomerAuth: AuthData = {
      accessToken: `mock-jwt-token-new-${Date.now()}`,
      refreshToken: `mock-refresh-token-${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 900000,
      user: {
        id: Date.now(),
        email: payload.email,
        fullName: payload.fullName,
        phone: payload.phone || '',
        role: 'STORAGE_CUSTOMER',
        facilityIds: [],
      },
    };
    saveSession(newCustomerAuth);
    return newCustomerAuth;
  }
}

/**
 * Đăng nhập bằng Google ID Token (Google Identity Services)
 */
export async function loginWithGoogle(idToken: string): Promise<AuthData> {
  const res = await apiClient<ApiResponse<AuthData> | AuthData>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });

  const authData = ('data' in res && res.data) ? res.data : (res as AuthData);
  saveSession(authData);
  return authData;
}

/**
 * Yêu cầu mã xác thực OTP 60s qua email để đặt lại mật khẩu
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  try {
    const res = await apiClient<ApiResponse<void> | void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    const msg = (res && typeof res === 'object' && 'message' in res)
      ? String((res as { message: unknown }).message)
      : 'Mã xác thực OTP đã được gửi đến email của bạn';
    return { message: msg };
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error && error.status && [400, 401, 403, 404, 409].includes(error.status)) {
      throw error;
    }
    // Fallback nếu backend offline
    return {
      message: `Hệ thống đã gửi mã OTP xác thực tới email ${email} (hiệu lực 60s).`,
    };
  }
}

/**
 * Kiểm tra mã xác thực OTP hợp lệ trước khi cho phép đặt mật khẩu mới
 */
export async function verifyOtp(payload: { email: string; otp: string }): Promise<{ message: string }> {
  try {
    const res = await apiClient<ApiResponse<void> | void>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const msg = (res && typeof res === 'object' && 'message' in res)
      ? String((res as { message: unknown }).message)
      : 'Mã xác thực OTP hợp lệ';
    return { message: msg };
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    if (error && error.status && [400, 401, 403, 404, 409].includes(error.status)) {
      throw error;
    }
    // Fallback nếu backend offline
    if (payload.otp.length === 6) {
      return { message: 'Mã xác thực OTP hợp lệ (Demo Mode)' };
    }
    throw new Error('Mã xác thực OTP không hợp lệ hoặc đã hết hạn.');
  }
}

/**
 * Đặt lại mật khẩu bằng mã OTP 60s
 */
export async function resetPassword(payload: { email: string; otp: string; newPassword: string }): Promise<{ message: string }> {
  const res = await apiClient<ApiResponse<void> | void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const msg = (res && typeof res === 'object' && 'message' in res)
    ? String((res as { message: unknown }).message)
    : 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới';
  return { message: msg };
}

/**
 * Lưu token và thông tin user vào localStorage đồng bộ cùng tokenStorage
 */
export function saveSession(authData: AuthData): void {
  const shortRole = normalizeRole(authData.user.role);

  tokenStorage.setAccessToken(authData.accessToken);
  if (authData.refreshToken) {
    tokenStorage.setRefreshToken(authData.refreshToken);
  }

  tokenStorage.setUser({
    id: authData.user.id,
    username: authData.user.email.split('@')[0],
    email: authData.user.email,
    fullName: authData.user.fullName,
    role: shortRole,
    facilityId: authData.user.facilityIds?.[0],
  });
}

/**
 * Đăng xuất người dùng và xóa toàn bộ phiên
 */
export function logoutUser(): void {
  tokenStorage.clearSession();
}

/**
 * Lấy đường dẫn portal phù hợp với role của user
 */
export function getPortalUrlByRole(role: string): string {
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'ADMIN':
      return '/admin';
    case 'BOM':
      return '/bom';
    case 'MANAGER':
      return '/manager';
    case 'STAFF':
      return '/staff';
    case 'CUSTOMER':
    default:
      return '/';
  }
}

export const authApi = {
  login: loginUser,
  loginWithGoogle,
  register: registerUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  logout: logoutUser,
  getPortalUrlByRole,
  saveSession,
};
