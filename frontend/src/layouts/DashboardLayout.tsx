import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  CalendarCheck,
  FileSpreadsheet,
  Wrench,
  BarChart3,
  Settings,
  Bell,
  Search,
  Globe,
  ChevronDown,
  Building2,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  href?: string;
}

export interface DashboardLayoutProps {
  children?: React.ReactNode;
  portalRole?: 'staff' | 'manager' | 'business_ops' | 'admin';
  userName?: string;
  userRoleLabel?: string;
  facilityName?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  portalRole = 'manager',
  userName = 'Trần Văn Minh',
  userRoleLabel = 'Facility Manager',
  facilityName = 'Cơ sở Quận 7 - Nam Sài Gòn',
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dynamic navigation items based on portal role
  const getNavItems = (): NavItem[] => {
    switch (portalRole) {
      case 'staff':
        return [
          { id: 'overview', label: 'Tổng quan ca trực', icon: LayoutDashboard },
          { id: 'units', label: 'Sơ đồ ngăn kho', icon: Box },
          { id: 'checkin', label: 'Bàn giao & Check-in', icon: CalendarCheck, badge: 3 },
          { id: 'maintenance', label: 'Kiểm tra & Sự cố', icon: Wrench, badge: 2 },
          { id: 'settings', label: 'Cài đặt', icon: Settings },
        ];
      case 'business_ops':
        return [
          { id: 'overview', label: 'Tổng quan tài chính', icon: LayoutDashboard },
          { id: 'contracts', label: 'Quản lý hợp đồng', icon: FileSpreadsheet },
          { id: 'invoices', label: 'Hóa đơn & Cọc', icon: BarChart3 },
          { id: 'pricing', label: 'Chính sách giá', icon: Settings },
        ];
      case 'admin':
        return [
          { id: 'overview', label: 'Tổng quan hệ thống', icon: LayoutDashboard },
          { id: 'users', label: 'Tài khoản & Phân quyền', icon: Shield },
          { id: 'facilities', label: 'Cơ sở & Tủ kho', icon: Building2 },
          { id: 'logs', label: 'Audit Logs', icon: FileSpreadsheet },
          { id: 'settings', label: 'Cấu hình hệ thống', icon: Settings },
        ];
      case 'manager':
      default:
        return [
          { id: 'overview', label: 'Tổng quan cơ sở', icon: LayoutDashboard },
          { id: 'units', label: 'Sơ đồ & Danh sách tủ', icon: Box },
          { id: 'bookings', label: 'Đơn đặt kho', icon: CalendarCheck, badge: 5 },
          { id: 'contracts', label: 'Hợp đồng thuê', icon: FileSpreadsheet },
          { id: 'maintenance', label: 'Bảo trì & Sự cố', icon: Wrench, badge: 1 },
          { id: 'reports', label: 'Báo cáo doanh thu', icon: BarChart3 },
          { id: 'settings', label: 'Cài đặt', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#f2f9f7] text-[#0a1614] flex">
      {/* Mobile backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar (Dub / Deep Pine Theme) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a1614] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#57b29a] flex items-center justify-center text-[#0a1614] font-bold shadow-sm">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">SmartStore</span>
              <span className="text-[11px] text-[#96b3cf] uppercase tracking-wider font-medium block">
                {userRoleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#57b29a]/15 text-[#57b29a] font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#57b29a]' : 'text-white/60'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-[#57b29a] text-[#0a1614]'
                        : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#57b29a]/20 border border-[#57b29a]/40 flex items-center justify-center text-xs font-bold text-[#57b29a]">
              {userName.split(' ').pop()?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[11px] text-[#96b3cf] truncate">{userRoleLabel}</p>
            </div>
          </div>
          <button
            title="Đăng xuất"
            className="text-white/50 hover:text-red-400 p-1.5 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
          {/* Left section: mobile hamburger + Facility tag */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f2f9f7] border border-slate-200 text-xs font-medium text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-[#57b29a]" />
              <span>{facilityName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Center search bar */}
          <div className="hidden md:flex items-center max-w-sm w-full mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm ô kho (A101), mã hợp đồng, CCCD..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#57b29a] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right section: Language toggle + Notifications */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50"
              title="Chuyển ngôn ngữ"
            >
              <Globe className="w-3.5 h-3.5 text-[#57b29a]" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Notification bell */}
            <button
              className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Thông báo hệ thống"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Main page content container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
