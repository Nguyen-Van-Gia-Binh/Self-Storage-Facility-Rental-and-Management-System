import { describe, it, expect, beforeEach } from 'vitest';
import { tokenStorage, DEMO_USERS } from '../tokenStorage';

class StorageMock implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

const mockLocalStorage = new StorageMock();
const mockSessionStorage = new StorageMock();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('tokenStorage.clearSession', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('phải xóa sạch toàn bộ token, session và các key mock override khi logout', () => {
    // 1. Giả lập đăng nhập và lưu các dữ liệu ghi đè
    tokenStorage.setAccessToken('mock_access_token');
    tokenStorage.setRefreshToken('mock_refresh_token');
    tokenStorage.setUser(DEMO_USERS.CUSTOMER);

    localStorage.setItem('smartstorage_customer_contracts_override', JSON.stringify([{ id: 101 }]));
    localStorage.setItem('smartstorage_contracts_override', JSON.stringify([{ id: 102 }]));
    localStorage.setItem('smartstorage_user_passes_v1', JSON.stringify([{ id: 201 }]));
    localStorage.setItem('smartstorage_move_in_passes', JSON.stringify([{ id: 202 }]));
    localStorage.setItem('smartstorage_pending_booking', JSON.stringify({ facilityId: 1 }));
    localStorage.setItem('smartstorage_payments_v1', JSON.stringify([{ id: 301 }]));
    localStorage.setItem('smartstorage_payments', JSON.stringify([{ id: 302 }]));
    localStorage.setItem('selfstorage_sample_key', 'test');
    sessionStorage.setItem('temp_session_key', 'value');

    expect(tokenStorage.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('smartstorage_pending_booking')).not.toBeNull();
    expect(sessionStorage.getItem('temp_session_key')).toBe('value');

    // 2. Thực hiện clearSession
    tokenStorage.clearSession();

    // 3. Xác nhận xóa sạch mọi keys liên quan
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(tokenStorage.getUser()).toBeNull();
    expect(tokenStorage.isAuthenticated()).toBe(false);

    expect(localStorage.getItem('smartstorage_customer_contracts_override')).toBeNull();
    expect(localStorage.getItem('smartstorage_contracts_override')).toBeNull();
    expect(localStorage.getItem('smartstorage_user_passes_v1')).toBeNull();
    expect(localStorage.getItem('smartstorage_move_in_passes')).toBeNull();
    expect(localStorage.getItem('smartstorage_pending_booking')).toBeNull();
    expect(localStorage.getItem('smartstorage_payments_v1')).toBeNull();
    expect(localStorage.getItem('smartstorage_payments')).toBeNull();
    expect(localStorage.getItem('selfstorage_sample_key')).toBeNull();
    expect(sessionStorage.getItem('temp_session_key')).toBeNull();
  });

  function createMockJwt(expSecondsFromNow: number): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
      })
    );
    return `${header}.${payload}.mock_signature`;
  }

  it('phải trả về null khi getUser() được gọi mà không có access token', () => {
    // Giả lập trạng thái có user trong localStorage nhưng KHÔNG có access token
    localStorage.setItem('selfstorage_user_session', JSON.stringify(DEMO_USERS.CUSTOMER));
    expect(tokenStorage.getAccessToken()).toBeNull();

    // getUser() không được trả về user mồ côi
    expect(tokenStorage.getUser()).toBeNull();
    expect(tokenStorage.isAuthenticated()).toBe(false);
  });

  it('phải tự động dọn sạch user session khi access token hết hạn', () => {
    const expiredToken = createMockJwt(-3600); // hết hạn 1 tiếng trước
    tokenStorage.setAccessToken(expiredToken);
    tokenStorage.setRefreshToken('mock_refresh_token');
    localStorage.setItem('selfstorage_user_session', JSON.stringify(DEMO_USERS.CUSTOMER));

    // Gọi getAccessToken() phải phát hiện hết hạn và dọn dẹp sạch
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getUser()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(tokenStorage.isAuthenticated()).toBe(false);
  });
});

