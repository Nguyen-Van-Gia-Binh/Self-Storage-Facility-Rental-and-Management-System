import { describe, it, expect } from 'vitest';
import { getPortalUrlByRole } from '@/api/auth';

describe('getPortalUrlByRole (ISS-115)', () => {
  it('điều hướng STAFF và FACILITY_STAFF vào đúng màn Nhiệm vụ ca trực (/staff)', () => {
    expect(getPortalUrlByRole('STAFF')).toBe('/staff');
    expect(getPortalUrlByRole('FACILITY_STAFF')).toBe('/staff');
    expect(getPortalUrlByRole('staff')).toBe('/staff');
  });

  it('điều hướng các vai trò khác vào đúng trang chủ của từng phân hệ', () => {
    expect(getPortalUrlByRole('ADMIN')).toBe('/admin/users');
    expect(getPortalUrlByRole('SYSTEM_ADMINISTRATOR')).toBe('/admin/users');
    expect(getPortalUrlByRole('BOM')).toBe('/bom/facilities');
    expect(getPortalUrlByRole('BUSINESS_OPERATIONS_MANAGER')).toBe('/bom/facilities');
    expect(getPortalUrlByRole('MANAGER')).toBe('/manager/facilities');
    expect(getPortalUrlByRole('FACILITY_MANAGER')).toBe('/manager/facilities');
    expect(getPortalUrlByRole('CUSTOMER')).toBe('/customer');
    expect(getPortalUrlByRole('STORAGE_CUSTOMER')).toBe('/customer');
  });
});
