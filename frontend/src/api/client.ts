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

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

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
