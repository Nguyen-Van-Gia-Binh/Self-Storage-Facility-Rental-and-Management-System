import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Phone, Shield, User, HelpCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CustomerLayoutProps {
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                SmartStorage <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-200">Customer</span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">Hệ thống Thuê kho tự quản thông minh</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/facilities" className="hover:text-teal-600 transition-colors flex items-center gap-1.5">
              <Box className="w-4 h-4 text-slate-400" /> Tìm cơ sở
            </Link>
            <a href="#rentals" className="hover:text-brand-600 transition-colors flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" /> Hợp đồng của tôi
            </a>
            <a href="#support" className="hover:text-brand-600 transition-colors flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-400" /> Hỗ trợ & Sự cố
            </a>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" /> Đăng nhập
            </Button>
            <Button variant="primary" size="sm">
              Thuê kho ngay
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Box className="w-5 h-5 text-brand-400" /> SmartStorage Platform
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Giải pháp lưu trữ và quản lý kho cá nhân, kho doanh nghiệp an toàn, bảo mật 24/7 với công nghệ kiểm soát ra vào thông minh.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Dịch vụ</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Kho Mini Standard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kho máy lạnh Climate-Controlled</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kho lưu trữ tài liệu doanh nghiệp</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Chính sách & Hướng dẫn</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-white transition-colors">Quy trình bàn giao & Nhận kho</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách giữ chỗ linh hoạt 48 giờ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách hoàn tiền và trả phòng kho</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Hỗ trợ khách hàng</h4>
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Phone className="w-4 h-4 text-emerald-400" /> 1900 6868 (24/7)
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-brand-400" /> Bảo hiểm hàng hóa & Giám sát 24/7
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 SmartStorage Platform. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs">
              <a href="#" className="hover:text-slate-400 transition-colors">Điều khoản dịch vụ</a>
              <span>·</span>
              <a href="#" className="hover:text-slate-400 transition-colors">Chính sách bảo mật</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
