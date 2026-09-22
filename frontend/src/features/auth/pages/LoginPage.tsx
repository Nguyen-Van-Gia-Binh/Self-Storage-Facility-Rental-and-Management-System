import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Boxes,
  Thermometer,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
} from 'lucide-react';
import { loginUser, getPortalUrlByRole } from '@/api/auth';
import type { UserRoleType } from '@/api/user';

const DEMO_ACCOUNTS: {
  label: string;
  roleName: string;
  email: string;
  role: UserRoleType;
  color: string;
}[] = [
  {
    label: '👑 Admin',
    roleName: 'Quản trị hệ thống',
    email: 'admin@smartstorage.vn',
    role: 'SYSTEM_ADMINISTRATOR',
    color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  },
  {
    label: '💼 BOM',
    roleName: 'Quản lý kinh doanh',
    email: 'bom@smartstorage.vn',
    role: 'BUSINESS_OPERATIONS_MANAGER',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  {
    label: '🏢 Quản lý cơ sở',
    roleName: 'Facility Manager',
    email: 'fm.q1@smartstorage.vn',
    role: 'FACILITY_MANAGER',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  {
    label: '👷 Nhân viên',
    roleName: 'Facility Staff',
    email: 'staff.q1@smartstorage.vn',
    role: 'FACILITY_STAFF',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  {
    label: '📦 Khách thuê',
    roleName: 'Customer',
    email: 'nhi.customer@gmail.com',
    role: 'STORAGE_CUSTOMER',
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('admin@smartstorage.vn');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successRole, setSuccessRole] = useState<UserRoleType | null>(null);

  const handleSelectDemo = (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(account.email);
    setPassword('password123');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ email: email.trim(), password });
      setSuccessRole(res.user.role);

      // Chuyển hướng sau 600ms để hiệu ứng thành công hiển thị mượt mà
      setTimeout(() => {
        const target = redirectParam || getPortalUrlByRole(res.user.role);
        navigate(target);
      }, 600);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100">
      {/* CỘT TRÁI: Hero Showcase (Ẩn trên màn hình rất nhỏ, hiện từ lg trở lên) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-r border-slate-800/60">
        {/* Decorative Glow Elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">SmartStorage</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Self-Storage Facility Rental & Management</p>
            </div>
          </Link>
        </div>

        {/* Center Content: Slogan & Highlights */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nền tảng Quản trị & Vận hành Kho 4.0</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              An toàn lưu trữ, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-indigo-300">
                Linh hoạt vận hành
              </span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Giải pháp toàn diện kết nối liền mạch từ Khách thuê, Nhân viên cơ sở, Quản lý chi nhánh đến Ban điều hành.
            </p>
          </div>

          {/* 3 Glassmorphism Feature Cards */}
          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center gap-4 hover:bg-white/[0.06] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Mã PIN & Cửa Tự Động 24/7</h4>
                <p className="text-xs text-slate-400 mt-0.5">Khách ra vào độc lập qua mã PIN điện tử, bảo mật cấp độ cao.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center gap-4 hover:bg-white/[0.06] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Kho Máy Lạnh Climate-Controlled</h4>
                <p className="text-xs text-slate-400 mt-0.5">Duy trì nhiệt độ và độ ẩm chuẩn xác, bảo vệ tối đa hàng hóa.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex items-center gap-4 hover:bg-white/[0.06] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Phân Quyền Chi Nhánh Chặt Chẽ</h4>
                <p className="text-xs text-slate-400 mt-0.5">Cách ly dữ liệu từng cơ sở (SA-03), kiểm soát truy cập tuyệt đối.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <span>SWP391 · Capstone Project Fall 2026</span>
          <span>Security JWT · Spring Boot 3 & React 19</span>
        </div>
      </div>

      {/* CỘT PHẢI: Form Đăng Nhập */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-slate-900 relative">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">SmartStorage</span>
              <p className="text-xs text-slate-400">Hệ Thống Quản Lý Kho Tự Phục Vụ</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Đăng nhập tài khoản
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Nhập email và mật khẩu của bạn để truy cập vào cổng làm việc.
            </p>
          </div>

          {/* Error / Success Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successRole && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Đăng nhập thành công! Đang chuyển hướng vào portal...</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smartstorage.vn"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Mật khẩu
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-amber-400 hover:text-amber-300 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-xs text-slate-400">Ghi nhớ đăng nhập trên thiết bị này</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to Register */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-center">
            <p className="text-xs text-slate-300">
              Chưa có tài khoản thuê kho?{' '}
              <Link
                to="/auth/register"
                className="font-bold text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1 ml-1"
              >
                Đăng ký tài khoản mới <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>

          {/* Quick Demo Switcher */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Chọn nhanh tài khoản Demo (SWP391):</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`p-2 rounded-xl border text-left text-xs transition-all flex flex-col justify-between cursor-pointer ${acc.color}`}
                >
                  <span className="font-bold">{acc.label}</span>
                  <span className="text-[10px] opacity-80 mt-1 truncate">{acc.email.split('@')[0]}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              💡 Bấm vào nút role ở trên để tự động điền Email và Mật khẩu mẫu.
            </p>
          </div>

          {/* Footer Back Link */}
          <div className="text-center pt-2">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span>← Quay lại Trang Chủ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
