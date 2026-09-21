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
 */
export const DEMO_USERS: Record<UserRole, UserSession> = {
  CUSTOMER: {
    id: 1,
    username: 'customer_demo',
    email: 'customer@selfstorage.vn',
    fullName: 'Nguyễn Văn Khách',
    role: 'CUSTOMER',
  },
  STAFF: {
    id: 2,
    username: 'staff_demo',
    email: 'staff@selfstorage.vn',
    fullName: 'Trần Thị Nhân Viên',
    role: 'STAFF',
    facilityId: 1,
  },
  MANAGER: {
    id: 3,
    username: 'manager_demo',
    email: 'manager@selfstorage.vn',
    fullName: 'Lê Văn Quản Lý',
    role: 'MANAGER',
    facilityId: 1,
  },
  BOM: {
    id: 4,
    username: 'bom_demo',
    email: 'bom@selfstorage.vn',
    fullName: 'Hoàng Thị Giám Đốc',
    role: 'BOM',
  },
  ADMIN: {
    id: 5,
    username: 'admin_demo',
    email: 'admin@selfstorage.vn',
    fullName: 'Quản Trị Viên Hệ Thống',
    role: 'ADMIN',
  },
};

export const tokenStorage = {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAccessToken(token: string): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // Bỏ qua nếu localStorage bị đầy hoặc bị vô hiệu hóa
    }
  },

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {
      // Bỏ qua nếu localStorage bị đầy hoặc bị vô hiệu hóa
    }
  },

  getUser(): UserSession | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  },

  setUser(user: UserSession): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Bỏ qua nếu localStorage bị đầy hoặc bị vô hiệu hóa
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(user.role);
  },

  /**
   * Chuyển đổi nhanh vai trò để chạy demo hoặc kiểm thử các portal khác nhau.
   */
  setDemoRole(role: UserRole): UserSession {
    const demoUser = DEMO_USERS[role];
    this.setUser(demoUser);
    this.setAccessToken(`mock-jwt-token-for-${role.toLowerCase()}`);
    return demoUser;
  },
};
