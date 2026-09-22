// frontend/src/layouts/navigationConfig.ts
import type { UserRole } from '@/utils/tokenStorage';

export interface NavItemConfig {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}

export interface RoleNavigation {
  portalTitle: string;
  role: UserRole;
  badgeColor: string;
  navItems: NavItemConfig[];
}

export const ROLE_NAVIGATIONS: Record<UserRole, RoleNavigation> = {
  CUSTOMER: {
    portalTitle: 'Khách hàng',
    role: 'CUSTOMER',
    badgeColor: 'bg-emerald-500',
    navItems: [
      { label: 'Trang chủ', href: '/' },
      { label: 'Tra cứu cơ sở & ô kho', href: '/facilities' },
      { label: 'Đặt chỗ ô kho', href: '/booking' },
      { label: 'Kho của tôi', href: '/customer/my-units' },
    ],
  },
  STAFF: {
    portalTitle: 'Staff Desk',
    role: 'STAFF',
    badgeColor: 'bg-blue-500',
    navItems: [
      { label: 'Tiếp đón Check-in', href: '/staff/check-in' },
      { label: 'Nghiệm thu trả kho', href: '/staff/return' },
      { label: 'Việc trong ngày', href: '/staff/tasks' },
    ],
  },
  MANAGER: {
    portalTitle: 'Facility Manager',
    role: 'MANAGER',
    badgeColor: 'bg-purple-500',
    navItems: [
      { label: 'Quản lý ô kho', href: '/manager/units' },
      { label: 'Giám sát hợp đồng', href: '/manager/contracts' },
      { label: 'Báo cáo cơ sở', href: '/manager/reports' },
      { label: 'Xử lý sự cố', href: '/manager/incidents' },
    ],
  },
  BOM: {
    portalTitle: 'BOM Operations',
    role: 'BOM',
    badgeColor: 'bg-amber-500',
    navItems: [
      { label: 'Danh mục cơ sở', href: '/bom/facilities' },
      { label: 'Bảng giá & Phụ phí', href: '/bom/pricing' },
      { label: 'Doanh thu toàn hệ thống', href: '/bom/revenue' },
      { label: 'Báo cáo tổng hợp', href: '/bom/reports' },
    ],
  },
  ADMIN: {
    portalTitle: 'System Admin',
    role: 'ADMIN',
    badgeColor: 'bg-rose-500',
    navItems: [
      { label: 'Quản lý tài khoản', href: '/admin/users' },
      { label: 'Phân quyền dữ liệu', href: '/admin/roles' },
      { label: 'Nhật ký hệ thống', href: '/admin/activity-logs' },
    ],
  },
};

export const getNavigationForRole = (role: UserRole): RoleNavigation => {
  return ROLE_NAVIGATIONS[role] || ROLE_NAVIGATIONS.CUSTOMER;
};
