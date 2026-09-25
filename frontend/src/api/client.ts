/**
 * HTTP Client wrapper chuẩn theo CONVENTIONS.md § 4.4
 * Tự động gắn Base URL, JWT token, hỗ trợ Mock Switch và chuẩn hóa format lỗi từ Spring Boot API
 */

export type WorkstreamKey = 'WS1' | 'WS2' | 'WS3' | 'WS4';

/**
 * Kiểm tra xem chức năng/workstream hiện tại có đang bật Mock Data hay không.
 * - Nếu cờ tổng VITE_USE_MOCK === 'true' -> Toàn bộ hệ thống dùng Mock.
 * - Nếu truyền ws ('WS1' | 'WS2' | 'WS3' | 'WS4'), kiểm tra cờ VITE_MOCK_{ws}.
 * - Mặc định trả về false (gọi Backend thật).
 */
export function isMockEnabled(ws?: WorkstreamKey): boolean {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return true;
  }
  if (ws) {
    const wsFlag = import.meta.env[`VITE_MOCK_${ws}`];
    if (wsFlag !== undefined) {
      return wsFlag === 'true';
    }
  }
  return false;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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
  const token =
    localStorage.getItem('selfstorage_access_token') ||
    localStorage.getItem('access_token');

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
