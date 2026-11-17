import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  ChevronDown, 
  LogIn, 
  UserPlus, 
  LogOut,
  LayoutDashboard,
  Bell,
  History
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { tokenStorage, normalizeRole, type UserSession } from '@/utils/tokenStorage';
import { getMyHistory, type CustomerHistoryItem } from '@/api/customerRentals';
import { markCustomerHistorySeen, readCustomerHistorySeenAt } from '@/features/customer/historySeen';


export interface CustomerLayoutProps {
  children: React.ReactNode;
}

const ROLE_PORTAL_MAP: Record<string, string> = {
  ADMIN: '/admin/users',
  BOM: '/bom/facilities',
  MANAGER: '/manager',
  STAFF: '/staff',
};

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserSession | null>(() => tokenStorage.getUser());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<CustomerHistoryItem[]>([]);
  const [seenAt, setSeenAt] = useState(() => readCustomerHistorySeenAt());
  const [isBellOpen, setIsBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const normalizedRole = user?.role ? normalizeRole(user.role) : null;
  const isInternalUser = normalizedRole && normalizedRole !== 'CUSTOMER';
  const rolePortalUrl = normalizedRole ? ROLE_PORTAL_MAP[normalizedRole] : null;

  // Đồng bộ phiên đăng nhập khi có thay đổi trong localStorage, khi focus tab hoặc khi chuyển trang
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(tokenStorage.getUser());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    setUser(tokenStorage.getUser());
    setSeenAt(readCustomerHistorySeenAt());
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setHistoryItems([]);
      return;
    }
    getMyHistory().then(setHistoryItems).catch(() => setHistoryItems([]));
  }, [user?.id, location.pathname]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    tokenStorage.clearSession();
    setUser(null);
    setIsDropdownOpen(false);
    navigate('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isHomeActive = location.pathname === '/' || location.pathname === '/customer';
  const isRentalsActive = location.pathname === '/customer/my-units' || location.pathname.startsWith('/customer/renew');
  const isHistoryActive = location.pathname.startsWith('/customer/history');
  const isSupportActive = location.pathname.startsWith('/customer/support');
  const unreadCount = historyItems.filter((item) => item.at && (!seenAt || item.at > seenAt)).length;
  const bellItems = historyItems.slice(0, 8);

  const openBell = () => {
    setIsBellOpen((prev) => !prev);
    setIsDropdownOpen(false);
    setSeenAt(markCustomerHistorySeen());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f9f7]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-brand-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Logo to="/" subtitle="Self-Storage Solutions" size="md" variant="light" />

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <Link 
              to="/" 
              className={`py-6 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 border-b-2 ${
                isHomeActive 
                  ? 'border-white text-white font-bold' 
                  : 'border-transparent text-white/80 hover:text-white'
              }`}
            >
              Trang chủ
            </Link>
            <Link 
              to="/customer/my-units" 
              className={`py-6 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 border-b-2 ${
                isRentalsActive 
                  ? 'border-white text-white font-bold' 
                  : 'border-transparent text-white/80 hover:text-white'
              }`}
            >
              Kho của tôi
            </Link>
            {user && (
              <Link
                to="/customer/history"
                className={`py-6 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 border-b-2 ${
                  isHistoryActive
                    ? 'border-white text-white font-bold'
                    : 'border-transparent text-white/80 hover:text-white'
                }`}
              >
                Lịch sử
              </Link>
            )}
            <Link 
              to="/customer/support" 
              className={`py-6 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 border-b-2 ${
                isSupportActive 
                  ? 'border-white text-white font-bold' 
                  : 'border-transparent text-white/80 hover:text-white'
              }`}
            >
              Hỗ trợ 24/7
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-2.5">
            {/* Hotline */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-semibold text-white">
              <Phone className="w-3.5 h-3.5 text-white" />
              <span>Hotline: 1900 8888</span>
            </div>

            {/* Auth Actions: Guest vs Logged In */}
            {user ? (
              <>
              <div className="relative" ref={bellRef}>
                <button
                  type="button"
                  onClick={openBell}
                  aria-label={`Thông báo, ${unreadCount} chưa đọc`}
                  className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/30 text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-150"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="num absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-white text-brand-700 text-[10px] font-bold leading-4 text-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {isBellOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    <p className="px-4 py-2 text-xs font-semibold text-slate-500">Thông báo</p>
                    {bellItems.length === 0 && (
                      <p className="px-4 py-3 text-sm text-slate-500">Chưa có thông báo.</p>
                    )}
                    <ul>
                      {bellItems.map((item, index) => (
                        <li key={`${item.kind}-${item.at}-${index}`} className="px-4 py-2 border-t border-slate-100">
                          <p className={`text-sm font-semibold text-slate-900 ${item.kind === 'CONTRACT' ? 'font-mono' : ''}`}>
                            {item.title}
                          </p>
                          <p className={`text-xs text-slate-500 ${item.kind === 'PAYMENT' ? 'num' : ''} ${item.kind === 'ADJUSTMENT' ? 'font-mono' : ''}`}>
                            {item.detail}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/customer/history"
                      onClick={() => setIsBellOpen(false)}
                      className="block px-4 py-2.5 text-xs font-semibold text-brand-600 border-t border-slate-100"
                    >
                      Xem tất cả lịch sử
                    </Link>
                  </div>
                )}
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-white/30 hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all duration-150 focus:outline-none cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-white text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(user.fullName)}
                  </div>
                  <span className="text-xs font-bold text-white hidden sm:inline max-w-[140px] truncate">
                    {user.fullName || user.username}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {user.email || 'Khách hàng SmartStorage'}
                      </p>
                    </div>

                    {isInternalUser && rolePortalUrl && (
                      <div className="p-1 border-b border-slate-100">
                        <Link
                          to={rolePortalUrl}
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100/80 rounded-xl transition-colors text-left"
                        >
                          <LayoutDashboard className="w-4 h-4 text-brand-600 shrink-0" />
                          <span>Vào trang Quản lý ({normalizedRole})</span>
                        </Link>
                      </div>
                    )}

                    <div className="pt-1">
                      <Link
                        to="/customer/history"
                        onClick={() => setIsDropdownOpen(false)}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <History className="w-4 h-4 text-slate-500" />
                        <span>Lịch sử</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>
            ) : (
              /* Guest Actions: Đăng nhập & Đăng ký */
              <div className="flex items-center gap-2 pl-1">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 active:scale-95 border border-white/40 rounded-xl transition-all duration-150"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-brand-700 bg-white hover:bg-brand-50 active:scale-95 rounded-xl shadow-xs transition-all duration-150"
                >
                  <UserPlus className="w-3.5 h-3.5 text-brand-700" />
                  <span>Đăng ký</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main key={location.pathname} className="flex-1 page-enter">
        {children}
      </main>

      {/* Footer (Chỉ hiển thị trên các trang nội bộ, trang chủ HomePage có Footer SaaS chuyên dụng) */}
      {!isHomeActive && (
        <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs mt-24 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo showSubtitle={false} size="sm" />
              <span className="text-slate-400">• © 2026 SmartStorage. Toàn bộ bản quyền được bảo lưu.</span>
            </div>

            <div className="flex items-center gap-6 text-slate-500 font-medium">
              <a href="#" className="hover:text-slate-900">Về chúng tôi</a>
              <Link to="/" className="hover:text-slate-900">Hệ thống cơ sở</Link>
              <a href="#" className="hover:text-slate-900">Trung tâm trợ giúp</a>
            </div>

            <div className="flex items-center gap-5 text-slate-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-500" /> Hotline: <strong className="text-slate-900">1900 8888</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-500" /> support@smartstorage.vn
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
