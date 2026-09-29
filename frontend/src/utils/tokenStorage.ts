// frontend/src/utils/tokenStorage.ts

export type UserRole = 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'BOM' | 'ADMIN';

export interface UserSession {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  facilityId?: number;
}

const ACCESS_TOKEN_KEY = 'selfstorage_access_token';
const REFRESH_TOKEN_KEY = 'selfstorage_refresh_token';
const USER_KEY = 'selfstorage_user_session';

/**
 * Mẫu tài khoản mặc định cho từng vai trò để phục vụ demo / development testing.
 * Khớp chính xác với seed tài khoản V12/V13 trong SQL Server.
 */
export const DEMO_USERS: Record<UserRole, UserSession> = {
  CUSTOMER: {
    id: 6,
    username: 'nhi.customer@gmail.com',
    email: 'nhi.customer@gmail.com',
    fullName: 'Trần Yến Nhi',
    role: 'CUSTOMER',
  },
  STAFF: {
    id: 4,
    username: 'staff.q1@smartstorage.vn',
    email: 'staff.q1@smartstorage.vn',
    fullName: 'Trần Văn Hùng',
    role: 'STAFF',
    facilityId: 1,
  },
  MANAGER: {
    id: 3,
    username: 'fm.q1@smartstorage.vn',
    email: 'fm.q1@smartstorage.vn',
    fullName: 'Nguyễn Văn Gia Bình',
    role: 'MANAGER',
    facilityId: 1,
  },
  BOM: {
    id: 2,
    username: 'bom@smartstorage.vn',
    email: 'bom@smartstorage.vn',
    fullName: 'Huỳnh Nhật',
    role: 'BOM',
  },
  ADMIN: {
    id: 1,
    username: 'admin@smartstorage.vn',
    email: 'admin@smartstorage.vn',
    fullName: 'Lê Thanh Tùng',
    role: 'ADMIN',
  },
};

export const tokenStorage = {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem('access_token');
    } catch {
      return null;
    }
  },

  setAccessToken(token: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      localStorage.setItem('access_token', token);
    } catch {
      // Bỏ qua nếu localStorage bị đầy hoặc bị vô hiệu hóa
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      localStorage.setItem('refresh_token', token);
    } catch {
      // Bỏ qua nếu localStorage bị đầy hoặc bị vô hiệu hóa
    }
  },

  getUser(): UserSession | null {
    try {
      const raw = localStorage.getItem(USER_KEY) || localStorage.getItem('current_user');
      if (!raw) return null;
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  },

  setUser(user: UserSession): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem('current_user', JSON.stringify(user));
      localStorage.setItem('user_role', user.role);
    } catch {
      // Bỏ qua nếu localStorage bị đầy hoặc bị vô hiệu hóa
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem('access_token');
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('current_user');
      localStorage.removeItem('user_role');

      // Quét và xóa toàn bộ các keys bộ nhớ đệm / override của phiên làm việc cũ
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('smartstorage_') || key.startsWith('selfstorage_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Xóa sạch cả sessionStorage
      sessionStorage.clear();
    } catch {
      // Bỏ qua nếu lỗi xóa
    }
  },

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    return Boolean(token || user);
  },

  hasRole(requiredRoles: UserRole | UserRole[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    const roles = (Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]).map((r) =>
      normalizeRole(r)
    );
    return roles.includes(normalizeRole(user.role));
  },
};

/**
 * Chuẩn hóa tên vai trò giữa chuẩn ngắn (CUSTOMER, STAFF...) và chuẩn Backend (STORAGE_CUSTOMER...)
 */
export function normalizeRole(role: string): UserRole {
  switch (role) {
    case 'STORAGE_CUSTOMER':
    case 'CUSTOMER':
      return 'CUSTOMER';
    case 'FACILITY_STAFF':
    case 'STAFF':
      return 'STAFF';
    case 'FACILITY_MANAGER':
    case 'MANAGER':
      return 'MANAGER';
    case 'BUSINESS_OPERATIONS_MANAGER':
    case 'BOM':
      return 'BOM';
    case 'SYSTEM_ADMINISTRATOR':
    case 'ADMIN':
      return 'ADMIN';
    default:
      return 'CUSTOMER';
  }
}
