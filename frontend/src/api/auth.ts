/**
 * Authentication API Client — T2.3, T2.12
 * Kết nối /auth/login, /auth/register và xử lý lưu phiên JWT token
 */
import { apiClient } from './client';
import type { ApiResponse } from './client';
import type { UserRoleType } from './user';
import { tokenStorage, normalizeRole } from '@/utils/tokenStorage';

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
 * Đăng nhập người dùng qua Backend Spring Boot (/api/v1/auth/login).
 * Lỗi xác thực hoặc mất kết nối đều được ném ra, không tạo phiên giả.
 */
export async function loginUser(payload: LoginPayload): Promise<AuthData> {
  const res = await apiClient<ApiResponse<AuthData> | AuthData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const authData = ('data' in res && res.data) ? res.data : (res as AuthData);
  saveSession(authData);
  return authData;
}

/**
 * Đăng ký tài khoản khách hàng mới: Kết nối /api/v1/auth/register (T2.12)
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthData> {
  const res = await apiClient<ApiResponse<AuthData> | AuthData>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const authData = ('data' in res && res.data) ? res.data : (res as AuthData);
  // Không lưu session tự động để người dùng tự nhập mật khẩu đăng nhập tại /login
  return authData;
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
    throw err;
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
    throw err;
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
      return '/admin/users';
    case 'BOM':
      return '/bom/facilities';
    case 'MANAGER':
      return '/manager/units';
    case 'STAFF':
      return '/staff/check-in';
    case 'CUSTOMER':
    default:
      return '/customer';
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
