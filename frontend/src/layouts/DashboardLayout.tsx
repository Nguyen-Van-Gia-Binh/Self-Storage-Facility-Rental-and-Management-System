import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Menu, X, LogOut, Layers, Box } from 'lucide-react';
import {
  tokenStorage,
  DEMO_USERS,
  type UserRole,
  type UserSession,
} from '@/utils/tokenStorage';
import { loginAsDemoRole } from '@/api/auth';
import {
  getNavigationForRole,
  type NavItemConfig,
} from './navigationConfig';
import { DemoRoleSwitcher } from '@/components/common/DemoRoleSwitcher';

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
  const displayFullName = React.useMemo(() => {
    if (!user?.fullName) return 'Người dùng';
    if (user.fullName.includes('Ã') || user.fullName.includes('á»') || user.fullName.includes('VÄƒn') || user.fullName.includes('BÃ')) {
      return DEMO_USERS[currentRole]?.fullName || 'Nguyễn Văn Gia Bình';
    }
    return user.fullName;
  }, [user?.fullName, currentRole]);

  const initials      = getInitials(displayFullName);
  const portalLabel   = ROLE_PORTAL_LABEL[currentRole];

  // Tự động đồng bộ JWT token thật từ backend khi tải portal demo
  useEffect(() => {
    const currentToken = tokenStorage.getAccessToken();
    if (!currentToken || currentToken.startsWith('mock-')) {
      loginAsDemoRole(currentRole)
        .then((updated) => setUser(updated))
        .catch((err) => console.warn('Auto-login demo backend account failed:', err));
    }
  }, [currentRole]);

  const handleLogout = () => {
    tokenStorage.clearSession();
    setUser(null);
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-[#f2f9f7] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white text-slate-900 border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link to="/customer" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-xs">
            <Box className="w-4 h-4" />
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-base text-slate-900 block leading-tight">SmartStorage</span>
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">{displayTitle}</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
          md:flex flex-col bg-white text-slate-800 border-r border-slate-200/90
          transition-all duration-300 ease-in-out z-20 flex-shrink-0 shadow-xs
        `}
      >
        {/* Sidebar Header */}
        {sidebarOpen ? (
          <div className="h-16 hidden md:flex items-center justify-between px-3.5 border-b border-slate-100">
            <div className="overflow-hidden transition-all duration-300 w-48 opacity-100">
              <Link to="/customer" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Box className="w-4 h-4" />
                </div>
                <div className="leading-tight truncate">
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight block">
                    SmartStorage
                  </span>
                  <span className="text-[10px] font-bold text-brand-600 tracking-wider uppercase block truncate">
                    {portalLabel}
                  </span>
                </div>
              </Link>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200/60 transition-colors shrink-0 cursor-pointer"
              title="Thu nhỏ menu"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="h-16 hidden md:flex items-center justify-center border-b border-slate-100 px-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="group relative w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
              title="Mở rộng menu"
            >
              <Box className="w-5 h-5 transition-transform duration-200 group-hover:scale-0 group-hover:opacity-0 absolute" />
              <ChevronRight className="w-5 h-5 transition-transform duration-200 scale-0 opacity-0 group-hover:scale-110 group-hover:opacity-100 absolute" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isExact = location.pathname === item.href || location.pathname === `${item.href}/`;
            const isChildActive = navItems.some(
              (other) => other.href !== item.href && other.href.startsWith(item.href) && location.pathname.startsWith(other.href)
            );
            const isActive = isExact || (location.pathname.startsWith(`${item.href}/`) && !isChildActive);
            const Icon = item.icon || Layers;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={!sidebarOpen ? item.label : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25 font-bold'
                    : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/70'
                  }
                `}
              >
                <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600'}`} />
                <span className={`truncate transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                  {item.label}
                </span>
                {item.badge && sidebarOpen && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-brand-50 text-brand-700 border border-brand-200/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 transition-all duration-300">
          {sidebarOpen ? (
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-extrabold text-slate-800">SmartStorage OS</p>
                <p className="text-[10px] text-slate-600">{portalLabel}</p>
              </div>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/60">
                v1.2
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="text-[10px] text-slate-600 font-mono font-bold">v1.2</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-6 shadow-xs flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 font-bold hidden sm:inline">{displayTitle}</span>
            {currentLabel && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
                <span className="font-extrabold text-slate-900">{currentLabel}</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            {/* Demo Role Switcher */}
            <DemoRoleSwitcher
              currentRole={currentRole}
              onRoleChanged={() => setUser(tokenStorage.getUser())}
            />

            {/* User Profile */}
            <div className="flex items-center space-x-2.5 border-l border-slate-200 pl-3">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                {initials}
              </div>
              {/* Name + Role */}
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">
                  {displayFullName}
                </p>
                <span className="inline-block text-[10px] text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-full mt-1 font-bold">
                  {currentRole}
                </span>
              </div>
              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content with background Soft Mint Mist */}
        <main
          key={location.pathname}
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#f2f9f7] page-enter"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
