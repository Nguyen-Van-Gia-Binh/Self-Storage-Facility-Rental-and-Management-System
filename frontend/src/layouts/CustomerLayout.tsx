import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Phone, Mail, ChevronDown } from 'lucide-react';


export interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const location = useLocation();

  const isHomeActive = location.pathname === '/customer';
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
          <div className="flex items-center gap-4">
            {/* Hotline */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
              <Phone className="w-3.5 h-3.5 text-brand-500" />
              <span>Hotline: 1900 8888</span>
            </div>

            {/* Language toggle: Active VI */}
            <div className="hidden sm:flex items-center text-xs font-bold rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5">
              <span className="px-2 py-1 bg-white text-brand-700 rounded shadow-xs">VI</span>
              <span className="px-2 py-1 text-slate-400 hover:text-slate-700 cursor-pointer">EN</span>
            </div>

            {/* Avatar / User pill */}
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200">
                XN
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">Xuân Nhi</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
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
