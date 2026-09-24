/**
 * HTTP Client wrapper chuẩn theo CONVENTIONS.md § 4.4
 * Tự động gắn Base URL, JWT token và chuẩn hóa format lỗi từ Spring Boot API
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  status: number;
  errorCode?: string;
  message: string;
  timestamp: string;
  errors?: Record<string, string>;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Tự động làm mới Access Token bằng Refresh Token nếu token hết hạn (401/403)
  if ((response.status === 401 || response.status === 403 || response.status === 500) && !endpoint.includes('/auth/')) {
    const refreshToken =
      localStorage.getItem('refresh_token') ||
      localStorage.getItem('selfstorage_refresh_token');

    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const resJson = await refreshRes.json();
          const newAccessToken =
            resJson?.data?.accessToken || resJson?.accessToken;

          if (newAccessToken) {
            localStorage.setItem('access_token', newAccessToken);
            localStorage.setItem('selfstorage_access_token', newAccessToken);

            // Thử lại request với token mới
            const retryHeaders: HeadersInit = {
              ...headers,
              Authorization: `Bearer ${newAccessToken}`,
            };

            response = await fetch(`${BASE_URL}${endpoint}`, {
              ...options,
              headers: retryHeaders,
            });
          }
        }
      } catch (refreshErr) {
        console.warn('Làm mới JWT token thất bại:', refreshErr);
      }
    }
  }

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      status: response.status,
      message: 'Đã xảy ra lỗi không xác định từ máy chủ',
      timestamp: new Date().toISOString(),
    }));
    throw errorData;
  }

  return response.json();
}
