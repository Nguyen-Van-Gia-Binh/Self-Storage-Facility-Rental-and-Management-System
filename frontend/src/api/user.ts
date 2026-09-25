/**
 * User Management & RBAC API Client — SA-01, SA-02, SA-03 (T2.4, T2.5, T2.6, T2.15)
 * API-SPEC.md § 4 (User Management)
 * Kết nối trực tiếp Backend Spring Boot REST API (/api/v1/users)
 */
import { apiClient } from './client';

export type UserRoleType =
  | 'STORAGE_CUSTOMER'
  | 'FACILITY_STAFF'
  | 'FACILITY_MANAGER'
  | 'BUSINESS_OPERATIONS_MANAGER'
  | 'SYSTEM_ADMINISTRATOR';

export type UserStatusType = 'ACTIVE' | 'INACTIVE';

export interface AppUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  identityNumber?: string;
  role: UserRoleType;
  status: UserStatusType;
  active: boolean;
  facilityIds: number[];
  createdAt: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last?: boolean;
}

export interface UserFilterParams {
  keyword?: string;
  role?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  identityNumber?: string;
  role: UserRoleType;
  facilityIds?: number[];
}

export interface UpdateUserPayload {
  fullName: string;
  phone: string;
  identityNumber?: string;
}

export interface UpdateUserRolePayload {
  role: UserRoleType;
  facilityIds?: number[];
}

export interface UpdateUserStatusPayload {
  status: UserStatusType;
}

/**
 * Lấy danh sách người dùng có phân trang và bộ lọc (SA-01)
 * GET /api/v1/users?page=...&size=...&keyword=...&role=...&status=...
 */
export async function getUsers(params?: UserFilterParams): Promise<PageResponse<AppUser>> {
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  const keyword = params?.keyword?.trim() ? params.keyword.trim().toLowerCase() : undefined;
  const role = params?.role;
  const status = params?.status;

  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('size', String(size));
  if (keyword) qs.set('keyword', keyword);
  if (role && role !== 'ALL') qs.set('role', role);
  if (status && status !== 'ALL') qs.set('status', status);

  const res = await apiClient<PageResponse<AppUser>>(`/users?${qs.toString()}`);
  return {
    ...res,
    last: res.last ?? (res.page >= res.totalPages - 1),
  };
}

/**
 * Lấy chi tiết thông tin một người dùng (SA-01)
 * GET /api/v1/users/{id}
 */
export async function getUserById(id: number): Promise<AppUser> {
  return await apiClient<AppUser>(`/users/${id}`);
}

/**
 * Tạo mới tài khoản người dùng nội bộ hoặc khách hàng (SA-01)
 * POST /api/v1/users
 */
export async function createUser(payload: CreateUserPayload): Promise<AppUser> {
  return await apiClient<AppUser>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Cập nhật thông tin cá nhân của người dùng (SA-01)
 * PUT /api/v1/users/{id}
 */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<AppUser> {
  return await apiClient<AppUser>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Gán vai trò và cơ sở làm việc cho người dùng (SA-02, SA-03)
 * PATCH /api/v1/users/{id}/role
 */
export async function updateUserRole(id: number, payload: UpdateUserRolePayload): Promise<AppUser> {
  return await apiClient<AppUser>(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Kích hoạt hoặc Khóa tài khoản người dùng (SA-01)
 * PATCH /api/v1/users/{id}/status
 */
export async function updateUserStatus(id: number, payload: UpdateUserStatusPayload): Promise<AppUser> {
  return await apiClient<AppUser>(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Lấy danh sách ID cơ sở được phân công của người dùng (SA-03)
 * GET /api/v1/users/{id}/facilities
 */
export async function getUserFacilities(id: number): Promise<number[]> {
  return await apiClient<number[]>(`/users/${id}/facilities`);
}
