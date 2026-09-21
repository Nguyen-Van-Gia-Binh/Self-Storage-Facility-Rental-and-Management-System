// frontend/src/layouts/DashboardLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  portalTitle: customTitle,
  navItems: customNavItems,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Xác định role phù hợp từ URL
  const detectRoleFromUrl = (): UserRole => {
    if (location.pathname.startsWith('/staff')) return 'STAFF';
    if (location.pathname.startsWith('/manager')) return 'MANAGER';
    if (location.pathname.startsWith('/bom')) return 'BOM';
    if (location.pathname.startsWith('/admin')) return 'ADMIN';
    return 'CUSTOMER';
  };

  const [user, setUser] = useState<UserSession | null>(() => {
    const existing = tokenStorage.getUser();
    if (existing) return existing;
    return tokenStorage.setDemoRole(detectRoleFromUrl());
  });

  const currentRole: UserRole = user?.role || detectRoleFromUrl();
  const roleNav = getNavigationForRole(currentRole);

  const displayTitle = customTitle || roleNav.portalTitle;
  const navItems = customNavItems || roleNav.navItems;

  const handleRoleChange = (newRole: UserRole) => {
    const updated = tokenStorage.setDemoRole(newRole);
    setUser(updated);
    // Điều hướng về trang chủ của role tương ứng
    switch (newRole) {
      case 'STAFF':
        navigate('/staff/check-in');
        break;
      case 'MANAGER':
        navigate('/manager/units');
        break;
      case 'BOM':
        navigate('/bom/facilities');
        break;
      case 'ADMIN':
        navigate('/admin/users');
        break;
      case 'CUSTOMER':
      default:
        navigate('/');
        break;
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
          className="p-1 rounded text-slate-300 hover:text-white"
          aria-label="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileMenuOpen ? 'block' : 'hidden'}
          md:flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 z-20
        `}
      >
        <div className="h-16 hidden md:flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen ? (
            <span className="font-bold text-lg text-amber-400 truncate">{displayTitle}</span>
          ) : (
            <span className="font-bold text-lg text-amber-400">SS</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1 rounded"
            title="Thu nhỏ / Mở rộng"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Danh mục điều hướng */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full text-slate-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          {sidebarOpen ? (
            <div>
              <p className="font-semibold text-slate-300">SWP391 Self-Storage</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Phân hệ {currentRole}</p>
            </div>
          ) : (
            <span className="text-center block">v1.0</span>
          )}
        </div>
      </aside>

      {/* Khu vực nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
          <div className="text-sm font-medium text-slate-600 hidden sm:block">
            Hệ thống quản lý cơ sở cho thuê ô kho tự quản
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            {/* Demo Role Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-100 px-2 py-1 rounded-lg text-xs">
              <span className="text-slate-500 font-medium hidden md:inline">Demo Role:</span>
              <select
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-none"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="BOM">BOM</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800">
                  {user?.fullName || 'Người dùng'}
                </p>
                <span className={`inline-block text-[10px] text-white px-1.5 py-0.2 rounded font-semibold ${roleNav.badgeColor}`}>
                  {currentRole}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </div>
  );
};
