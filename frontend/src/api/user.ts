/**
 * User Management & RBAC API Client — SA-01, SA-02, SA-03 (T2.4, T2.5, T2.6, T2.15)
 * API-SPEC.md § 4 (User Management)
 */
import { apiClient } from './client';
import mockUsersData from '@/mock/mock-users.json';

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
  last: boolean;
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

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Bộ nhớ đệm Mock Data để hỗ trợ tương tác thử nghiệm mượt mà trên UI
const inMemoryUsers: AppUser[] = JSON.parse(JSON.stringify(mockUsersData)) as AppUser[];


/**
 * Lấy danh sách người dùng có phân trang và bộ lọc (SA-01)
 */
export async function getUsers(params?: UserFilterParams): Promise<PageResponse<AppUser>> {
  const page = params?.page ?? 0;
  const size = params?.size ?? 10;
  const keyword = params?.keyword?.trim() ? params.keyword.trim().toLowerCase() : undefined;
  const role = params?.role;
  const status = params?.status;

  if (USE_MOCK) {
    return filterMockUsers(keyword, role, status, page, size);
  }

  try {
    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('size', String(size));
    if (keyword) qs.set('keyword', keyword);
    if (role && role !== 'ALL') qs.set('role', role);
    if (status && status !== 'ALL') qs.set('status', status);

    return await apiClient<PageResponse<AppUser>>(`/users?${qs.toString()}`);
  } catch (err) {
    console.warn('Lỗi gọi API /users, fallback sang mock data:', err);
    return filterMockUsers(keyword, role, status, page, size);
  }
}

/**
 * Lấy chi tiết thông tin một người dùng (SA-01)
 */
export async function getUserById(id: number): Promise<AppUser> {
  if (USE_MOCK) {
    const found = inMemoryUsers.find((u) => u.id === id);
    if (!found) throw { status: 404, message: 'Người dùng không tồn tại' };
    return found;
  }

  try {
    return await apiClient<AppUser>(`/users/${id}`);
  } catch (err) {
    console.warn(`Lỗi gọi API /users/${id}, fallback sang mock data:`, err);
    const found = inMemoryUsers.find((u) => u.id === id);
    if (!found) throw { status: 404, message: 'Người dùng không tồn tại' };
    return found;
  }
}

/**
 * Tạo mới tài khoản người dùng nội bộ hoặc khách hàng (SA-01)
 */
export async function createUser(payload: CreateUserPayload): Promise<AppUser> {
  if (USE_MOCK) {
    const exists = inMemoryUsers.some((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (exists) {
      throw { status: 409, message: 'Email này đã được đăng ký tài khoản' };
    }
    const newUser: AppUser = {
      id: Math.max(...inMemoryUsers.map((u) => u.id), 0) + 1,
      email: payload.email,
      fullName: payload.fullName,
      phone: payload.phone,
      identityNumber: payload.identityNumber,
      role: payload.role,
      status: 'ACTIVE',
      active: true,
      facilityIds: payload.facilityIds ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryUsers.unshift(newUser);
    return newUser;
  }

  try {
    return await apiClient<AppUser>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Lỗi gọi API POST /users, fallback sang mock:', err);
    throw err;
  }
}

/**
 * Cập nhật thông tin cá nhân của người dùng (SA-01)
 */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<AppUser> {
  if (USE_MOCK) {
    const index = inMemoryUsers.findIndex((u) => u.id === id);
    if (index === -1) throw { status: 404, message: 'Người dùng không tồn tại' };
    inMemoryUsers[index] = {
      ...inMemoryUsers[index],
      fullName: payload.fullName,
      phone: payload.phone,
      identityNumber: payload.identityNumber,
      updatedAt: new Date().toISOString(),
    };
    return inMemoryUsers[index];
  }

  try {
    return await apiClient<AppUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn(`Lỗi gọi API PUT /users/${id}, fallback:`, err);
    throw err;
  }
}

/**
 * Gán vai trò và cơ sở làm việc cho người dùng (SA-02, SA-03)
 */
export async function updateUserRole(id: number, payload: UpdateUserRolePayload): Promise<AppUser> {
  if (USE_MOCK) {
    const index = inMemoryUsers.findIndex((u) => u.id === id);
    if (index === -1) throw { status: 404, message: 'Người dùng không tồn tại' };

    // Ràng buộc nghiệp vụ SA-02/SA-03
    if (
      (payload.role === 'FACILITY_STAFF' || payload.role === 'FACILITY_MANAGER') &&
      (!payload.facilityIds || payload.facilityIds.length === 0)
    ) {
      throw {
        status: 400,
        message: 'Vai trò Nhân viên hoặc Quản lý cơ sở yêu cầu phải gán ít nhất một cơ sở làm việc',
      };
    }

    inMemoryUsers[index] = {
      ...inMemoryUsers[index],
      role: payload.role,
      facilityIds:
        payload.role === 'FACILITY_STAFF' || payload.role === 'FACILITY_MANAGER'
          ? payload.facilityIds ?? []
          : [],
      updatedAt: new Date().toISOString(),
    };
    return inMemoryUsers[index];
  }

  try {
    return await apiClient<AppUser>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn(`Lỗi gọi API PATCH /users/${id}/role:`, err);
    throw err;
  }
}

/**
 * Kích hoạt hoặc Khóa tài khoản người dùng (SA-01)
 */
export async function updateUserStatus(id: number, payload: UpdateUserStatusPayload): Promise<AppUser> {
  if (USE_MOCK) {
    const index = inMemoryUsers.findIndex((u) => u.id === id);
    if (index === -1) throw { status: 404, message: 'Người dùng không tồn tại' };

    inMemoryUsers[index] = {
      ...inMemoryUsers[index],
      status: payload.status,
      active: payload.status === 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };
    return inMemoryUsers[index];
  }

  try {
    return await apiClient<AppUser>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn(`Lỗi gọi API PATCH /users/${id}/status:`, err);
    throw err;
  }
}

/**
 * Lấy danh sách ID cơ sở được phân công của người dùng (SA-03)
 */
export async function getUserFacilities(id: number): Promise<number[]> {
  if (USE_MOCK) {
    const user = inMemoryUsers.find((u) => u.id === id);
    return user ? user.facilityIds : [];
  }

  try {
    return await apiClient<number[]>(`/users/${id}/facilities`);
  } catch (err) {
    console.warn(`Lỗi gọi API /users/${id}/facilities:`, err);
    const user = inMemoryUsers.find((u) => u.id === id);
    return user ? user.facilityIds : [];
  }
}

/**
 * Hàm lọc nội bộ hỗ trợ mock phân trang
 */
function filterMockUsers(
  keyword?: string,
  role?: string,
  status?: string,
  page: number = 0,
  size: number = 10
): PageResponse<AppUser> {
  let filtered = [...inMemoryUsers];

  if (keyword) {
    filtered = filtered.filter(
      (u) =>
        u.fullName.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword) ||
        u.phone.includes(keyword)
    );
  }

  if (role && role !== 'ALL') {
    filtered = filtered.filter((u) => u.role === role);
  }

  if (status && status !== 'ALL') {
    filtered = filtered.filter((u) => u.status === status);
  }

  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const start = page * size;
  const content = filtered.slice(start, start + size);

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1,
  };
}
