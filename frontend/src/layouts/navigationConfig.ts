// frontend/src/layouts/navigationConfig.ts
import type { LucideIcon } from 'lucide-react';
import {
  Home, Archive,
  KeyRound, ClipboardCheck,
  Layers, FileText, BarChart3, Wrench, Users,
  Map, DollarSign, TrendingUp, History,
  UserCog, ShieldCheck, Activity,
} from 'lucide-react';
import type { UserRole } from '@/utils/tokenStorage';

export interface NavItemConfig {
  label: string;
  href: string;
  icon?: LucideIcon;
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
      { label: 'Trang chủ',            href: '/customer',          icon: Home },
      { label: 'Kho của tôi',           href: '/customer/my-units', icon: Archive },
    ],
  },
  STAFF: {
    portalTitle: 'Staff Desk',
    role: 'STAFF',
    badgeColor: 'bg-blue-500',
    navItems: [
      { label: 'Tổng quan ca trực',   href: '/staff',          icon: Home },
      { label: 'Tiếp đón Check-in',   href: '/staff/check-in', icon: KeyRound },
      { label: 'Nghiệm thu trả kho',  href: '/staff/return',   icon: ClipboardCheck },
      { label: 'Xử lý sự cố',         href: '/staff/incidents', icon: Wrench },
    ],
  },
  MANAGER: {
    portalTitle: 'Facility Manager',
    role: 'MANAGER',
    badgeColor: 'bg-purple-500',
    navItems: [
      { label: 'Tổng quan cơ sở',    href: '/manager',                  icon: Home },
      { label: 'Quản lý ô kho',      href: '/manager/facilities',       icon: Layers },
      { label: 'Giám sát hợp đồng',  href: '/manager/contracts',        icon: FileText },
      { label: 'Phân công nhân sự',  href: '/manager/staff-schedule',   icon: Users },
      { label: 'Xử lý sự cố',        href: '/manager/incidents',        icon: Wrench },
      { label: 'Báo cáo cơ sở',      href: '/manager/reports',          icon: BarChart3 },
    ],
  },
  BOM: {
    portalTitle: 'BOM Operations',
    role: 'BOM',
    badgeColor: 'bg-amber-500',
    navItems: [
      { label: 'Danh mục cơ sở',      href: '/bom/facilities', icon: Map },
      { label: 'Bảng giá & Phụ phí',  href: '/bom/pricing',    icon: DollarSign },
      { label: 'Chính sách thuê',     href: '/bom/policies',   icon: ShieldCheck },
      { label: 'Doanh thu & Báo cáo', href: '/bom/revenue',    icon: TrendingUp },
      { label: 'Nhật ký giá & phí',   href: '/bom/price-audit', icon: History },
    ],
  },
  ADMIN: {
    portalTitle: 'System Admin',
    role: 'ADMIN',
    badgeColor: 'bg-rose-500',
    navItems: [
      { label: 'Quản lý tài khoản',  href: '/admin/users',         icon: UserCog },
      { label: 'Nhật ký hệ thống',   href: '/admin/activity-logs', icon: Activity },
    ],
  },
};

export const getNavigationForRole = (role: UserRole): RoleNavigation => {
  return ROLE_NAVIGATIONS[role] || ROLE_NAVIGATIONS.CUSTOMER;
};
