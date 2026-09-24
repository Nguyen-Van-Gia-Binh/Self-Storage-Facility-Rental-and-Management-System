import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Phone, 
  Mail, 
  ChevronDown, 
  LogIn, 
  UserPlus, 
  LogOut 
} from 'lucide-react';
import { tokenStorage, type UserSession } from '@/utils/tokenStorage';


export interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserSession | null>(() => tokenStorage.getUser());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đồng bộ phiên đăng nhập khi có thay đổi trong localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(tokenStorage.getUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    tokenStorage.clearSession();
    setUser(null);
    setIsDropdownOpen(false);
    navigate('/customer');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isHomeActive = location.pathname === '/' || location.pathname === '/customer';
  const isUnitsActive = location.pathname.startsWith('/customer/units') || location.pathname.startsWith('/customer/book');
  const isRentalsActive = location.pathname === '/customer/my-units' || location.pathname.startsWith('/customer/renew');
  const isSupportActive = location.pathname.startsWith('/customer/support');

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f9f7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/customer" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-sm">
              <Box className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight block">
                SmartStorage
              </span>
              <span className="text-[10px] font-bold text-brand-600 tracking-wider uppercase block">
                Self-Storage Solutions
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <Link 
              to="/customer" 
              className={`py-6 transition-colors border-b-2 ${
                isHomeActive 
                  ? 'border-brand-500 text-slate-900 font-bold' 
                  : 'border-transparent text-slate-600 hover:text-brand-600'
              }`}
            >
              Trang chủ
            </Link>
            <Link 
              to="/customer/units" 
              className={`py-6 transition-colors border-b-2 ${
                isUnitsActive 
                  ? 'border-brand-500 text-slate-900 font-bold' 
                  : 'border-transparent text-slate-600 hover:text-brand-600'
              }`}
            >
              Sơ đồ ô kho
            </Link>
            <Link 
              to="/customer/my-units" 
              className={`py-6 transition-colors border-b-2 ${
                isRentalsActive 
                  ? 'border-brand-500 text-slate-900 font-bold' 
                  : 'border-transparent text-slate-600 hover:text-brand-600'
              }`}
            >
              Kho của tôi
            </Link>
            <Link 
              to="/customer/support" 
              className={`py-6 transition-colors border-b-2 ${
                isSupportActive 
                  ? 'border-brand-500 text-slate-900 font-bold' 
                  : 'border-transparent text-slate-600 hover:text-brand-600'
              }`}
            >
              Hỗ trợ 24/7
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {/* Hotline */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <Phone className="w-3.5 h-3.5 text-brand-500" />
              <span>Hotline: 1900 8888</span>
            </div>

            {/* Auth Actions: Guest vs Logged In */}
            {user ? (
              /* Avatar / User pill with dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all focus:outline-none cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200 shrink-0">
                    {getInitials(user.fullName)}
                  </div>
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[140px] truncate">
                    {user.fullName || user.username}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
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

                    <div className="pt-1">
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
            ) : (
              /* Guest Actions: Đăng nhập & Đăng ký */
              <div className="flex items-center gap-2 pl-1">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-brand-600" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  to="/auth/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng ký</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs mt-24 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center text-white">
              <Box className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900">SmartStorage</span>
            <span className="text-slate-400">• © 2026 SmartStorage. Toàn bộ bản quyền được bảo lưu.</span>
          </div>

          <div className="flex items-center gap-6 text-slate-500 font-medium">
            <a href="#" className="hover:text-slate-900">Về chúng tôi</a>
            <Link to="/customer" className="hover:text-slate-900">Hệ thống cơ sở</Link>
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
    </div>
  );
};
