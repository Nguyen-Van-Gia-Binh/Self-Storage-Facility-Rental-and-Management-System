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
  details?: string[];
  errors?: Record<string, string>;
}

export class ApiException extends Error implements ApiError {
  status: number;
  errorCode?: string;
  timestamp: string;
  details?: string[];
  errors?: Record<string, string>;

  constructor(errorData: ApiError) {
    const detailMsg = errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0
      ? `${errorData.message}: ${errorData.details.join(', ')}`
      : errorData.message;
    super(detailMsg || 'Đã xảy ra lỗi không xác định từ máy chủ');
    this.name = 'ApiException';
    this.status = errorData.status;
    this.errorCode = errorData.errorCode;
    this.timestamp = errorData.timestamp;
    this.details = errorData.details;
    this.errors = errorData.errors;
  }
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

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const signal = options.signal || controller.signal;

    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal,
    });
    clearTimeout(timeoutId);
  } catch (err: any) {
    if (err instanceof ApiException) {
      throw err;
    }
    if (err?.name === 'AbortError' || err?.name === 'TimeoutError') {
      throw new ApiException({
        status: 504,
        message: 'Quá thời gian chờ phản hồi từ máy chủ (Timeout 30s). Vui lòng kiểm tra lại dịch vụ backend.',
        timestamp: new Date().toISOString(),
      });
    }
    throw new ApiException({
      status: 503,
      message: 'Không thể kết nối đến máy chủ backend (Port 8080). Vui lòng kiểm tra xem Backend đã được khởi động chưa.',
      timestamp: new Date().toISOString(),
    });
  }

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
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      const text = await response.text().catch(() => '');
      errorData = {
        status: response.status,
        message: text && text.length > 0 && text.length < 150 ? text : `Đã xảy ra lỗi từ máy chủ (${response.status})`,
        timestamp: new Date().toISOString(),
      };
    }
    throw new ApiException(errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text || !text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}
