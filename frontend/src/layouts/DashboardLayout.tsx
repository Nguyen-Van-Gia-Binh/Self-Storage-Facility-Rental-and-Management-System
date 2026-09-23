// frontend/src/layouts/DashboardLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, X, LogOut, Layers } from 'lucide-react';
import {
  tokenStorage,
  type UserRole,
  type UserSession,
} from '@/utils/tokenStorage';
import {
  getNavigationForRole,
  type NavItemConfig,
} from './navigationConfig';

export type NavItem = NavItemConfig;

interface DashboardLayoutProps {
  portalTitle?: string;
  navItems?: NavItemConfig[];
  children: React.ReactNode;
}

// Breadcrumb label map
const BREADCRUMB_MAP: Record<string, string> = {
  '/staff':                    'Tổng quan ca trực',
  '/staff/check-in':           'Tiếp đón Check-in',
  '/staff/checkin':            'Tiếp đón Check-in',
  '/staff/return':             'Nghiệm thu trả kho',
  '/staff/tasks':              'Việc trong ngày',
  '/manager':                  'Tổng quan cơ sở',
  '/manager/units':            'Quản lý ô kho',
  '/manager/contracts':        'Giám sát hợp đồng',
  '/manager/staff-assignment': 'Phân công nhân sự',
  '/manager/incidents':        'Xử lý sự cố',
  '/manager/reports':          'Báo cáo cơ sở',
  '/admin':                    'Quản lý tài khoản',
  '/admin/users':              'Quản lý tài khoản',
  '/admin/roles':              'Phân quyền vai trò',
  '/admin/facility-assignments': 'Gán cơ sở nhân sự',
  '/admin/activity-logs':      'Nhật ký hệ thống',
  '/bom/facilities':           'Danh mục cơ sở',
  '/bom/pricing':              'Bảng giá & Phụ phí',
  '/bom/revenue':              'Doanh thu toàn hệ thống',
  '/bom/reports':              'Báo cáo tổng hợp',
};

// Avatar color by role
const ROLE_AVATAR_COLOR: Record<UserRole, string> = {
  ADMIN:    'bg-rose-600',
  MANAGER:  'bg-purple-600',
  STAFF:    'bg-blue-600',
  BOM:      'bg-amber-600',
  CUSTOMER: 'bg-emerald-600',
};

// Portal label by role
const ROLE_PORTAL_LABEL: Record<UserRole, string> = {
  ADMIN:    'System Admin',
  MANAGER:  'Facility Manager',
  STAFF:    'Staff Desk',
  BOM:      'BOM Operations',
  CUSTOMER: 'Customer Portal',
};

function getInitials(fullName?: string): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  portalTitle: customTitle,
  navItems: customNavItems,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Xác định role từ URL
  const detectRoleFromUrl = (): UserRole => {
    if (location.pathname.startsWith('/staff'))   return 'STAFF';
    if (location.pathname.startsWith('/manager')) return 'MANAGER';
    if (location.pathname.startsWith('/bom'))     return 'BOM';
    if (location.pathname.startsWith('/admin'))   return 'ADMIN';
    return 'CUSTOMER';
  };

  const [user, setUser] = useState<UserSession | null>(() => {
    const existing = tokenStorage.getUser();
    if (existing) return existing;
    return tokenStorage.setDemoRole(detectRoleFromUrl());
  });

  const currentRole: UserRole = user?.role || detectRoleFromUrl();
  const roleNav = getNavigationForRole(currentRole);

  const displayTitle  = customTitle    || roleNav.portalTitle;
  const navItems      = customNavItems || roleNav.navItems;
  const currentLabel  = BREADCRUMB_MAP[location.pathname];
  const avatarColor   = ROLE_AVATAR_COLOR[currentRole];
  const initials      = getInitials(user?.fullName);
  const portalLabel   = ROLE_PORTAL_LABEL[currentRole];

  const handleRoleChange = (newRole: UserRole) => {
    const updated = tokenStorage.setDemoRole(newRole);
    setUser(updated);
    switch (newRole) {
      case 'STAFF':    navigate('/staff/check-in');  break;
      case 'MANAGER':  navigate('/manager/units');   break;
      case 'BOM':      navigate('/bom/facilities');  break;
      case 'ADMIN':    navigate('/admin/users');     break;
      default:         navigate('/');
    }
  };

  const handleLogout = () => {
    tokenStorage.clearSession();
    setUser(null);
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <span className="font-bold text-lg text-amber-400">{displayTitle}</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-[72px]'}
          ${mobileMenuOpen ? 'flex' : 'hidden'}
          md:flex flex-col bg-slate-900 text-slate-100
          transition-all duration-300 ease-in-out z-20 flex-shrink-0
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 hidden md:flex items-center justify-between px-4 border-b border-slate-800/60">
          <div className={`overflow-hidden transition-all duration-300 ${sidebarOpen ? 'w-40 opacity-100' : 'w-0 opacity-0'}`}>
            <span className="font-bold text-base text-amber-400 whitespace-nowrap">{displayTitle}</span>
          </div>
          {!sidebarOpen && (
            <span className="font-bold text-base text-amber-400 mx-auto">SS</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Thu nhỏ / Mở rộng"
          >
            {sidebarOpen
              ? <ChevronLeft className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
            }
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
              || (item.href !== '/' && location.pathname.startsWith(item.href));
            const Icon = item.icon || Layers;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={!sidebarOpen ? item.label : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                <span className={`truncate transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                  {item.label}
                </span>
                {item.badge && sidebarOpen && (
                  <span className="ml-auto bg-slate-700 text-xs px-2 py-0.5 rounded-full text-slate-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t border-slate-800/60 transition-all duration-300`}>
          {sidebarOpen ? (
            <div className="px-1">
              <p className="text-xs font-semibold text-slate-300">SWP391 Self-Storage</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{portalLabel}</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="text-[10px] text-slate-600 font-mono">v1.0</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium hidden sm:inline">{displayTitle}</span>
            {currentLabel && (
              <>
                <span className="text-slate-300 hidden sm:inline">/</span>
                <span className="font-semibold text-slate-700">{currentLabel}</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            {/* Demo Role Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs border border-slate-200">
              <span className="text-slate-500 font-medium hidden md:inline">Demo:</span>
              <select
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-none text-xs"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="BOM">BOM</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-2.5 border-l border-slate-200 pl-3">
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                {initials}
              </div>
              {/* Name + Role */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {user?.fullName || 'Người dùng'}
                </p>
                <span className={`inline-block text-[10px] text-white px-1.5 py-0.5 rounded mt-0.5 font-semibold ${roleNav.badgeColor}`}>
                  {currentRole}
                </span>
              </div>
              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content with page-enter animation */}
        <main
          key={location.pathname}
          className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 page-enter"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

