import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

interface DashboardLayoutProps {
  portalTitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  portalTitle,
  navItems,
  children,
}) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-slate-100 transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen ? (
            <span className="font-bold text-lg text-amber-400">{portalTitle}</span>
          ) : (
            <span className="font-bold text-lg text-amber-400">SS</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          {sidebarOpen && <p>SWP391 — Self-Storage v1.0</p>}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="text-sm text-gray-500">
            Hệ thống quản lý kho lưu trữ tự phục vụ
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Tài khoản demo</span>
            <Link
              to="/auth/login"
              className="text-xs text-red-600 hover:underline"
            >
              Đăng xuất
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
