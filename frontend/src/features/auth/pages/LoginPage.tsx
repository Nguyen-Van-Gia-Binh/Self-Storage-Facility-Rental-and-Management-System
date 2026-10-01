import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Thermometer,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { loginUser, loginWithGoogle, getPortalUrlByRole } from '@/api/auth';
import type { UserRoleType } from '@/api/user';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential?: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [successRole, setSuccessRole] = useState<UserRoleType | null>(null);

  // Điền sẵn email và hiển thị thông báo nếu vừa đăng ký thành công
  useEffect(() => {
    const isRegistered = searchParams.get('registered') === 'true' || (location.state as any)?.registered;
    const initialEmail = searchParams.get('email') || (location.state as any)?.email;
    if (isRegistered) {
      if (initialEmail) {
        setEmail(initialEmail);
      }
      setSuccessMsg('Đăng ký tài khoản thành công! Vui lòng nhập mật khẩu để đăng nhập.');
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '109364799143-s4gsllthdljfshrivptd03aog9jf3bvr.apps.googleusercontent.com';
    if (!clientId) return;

    const handleGoogleCredentialResponse = async (response: { credential?: string }) => {
      if (!response.credential) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await loginWithGoogle(response.credential);
        setSuccessRole(res.user.role);
        setTimeout(() => {
          const target = redirectParam || getPortalUrlByRole(res.user.role);
          navigate(target);
        }, 600);
      } catch (err: unknown) {
        const error = err as { message?: string };
        setErrorMsg(error.message || 'Đăng nhập bằng tài khoản Google thất bại. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    };

    const initGoogleGis = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });

        const btnEl = document.getElementById('googleSignInBtn');
        if (btnEl) {
          btnEl.innerHTML = '';
          window.google.accounts.id.renderButton(btnEl, {
            theme: 'filled_black',
            size: 'large',
            shape: 'rectangular',
            text: 'continue_with',
            width: 350,
            logo_alignment: 'left',
          });
        }
        return true;
      }
      return false;
    };

    if (!initGoogleGis()) {
      const interval = setInterval(() => {
        if (initGoogleGis()) {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [navigate, redirectParam]);

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f2f9f7] text-slate-900">
      {/* CỘT TRÁI: Hero Showcase (Ẩn trên màn hình rất nhỏ, hiện từ lg trở lên) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#0c2420] via-[#0f2d28] to-[#0a1614] border-r border-[#1a3832]/60">
        {/* Decorative Glow Elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Logo */}
        <div className="relative z-10">
          <Logo 
            to="/" 
            variant="light" 
            size="lg" 
            badge="v2.0" 
            subtitle="Self-Storage Facility Rental & Management" 
          />
        </div>

        {/* Center Content: Slogan & Highlights */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/60 border border-brand-700/60 text-xs font-medium text-brand-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nền tảng Quản trị & Vận hành Kho 4.0</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              An toàn lưu trữ, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-emerald-200 to-teal-100">
                Linh hoạt vận hành
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Giải pháp toàn diện kết nối liền mạch từ Khách thuê, Nhân viên cơ sở, Quản lý chi nhánh đến Ban điều hành.
            </p>
          </div>

          {/* 3 Glassmorphism Feature Cards */}
          <div className="space-y-3.5">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-4 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center border border-brand-500/30 flex-shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Mã PIN & Cửa Tự Động 24/7</h4>
                <p className="text-xs text-slate-300 mt-0.5">Khách ra vào độc lập qua mã PIN điện tử, bảo mật cấp độ cao.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-4 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 flex-shrink-0">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Kho Máy Lạnh Climate-Controlled</h4>
                <p className="text-xs text-slate-300 mt-0.5">Duy trì nhiệt độ và độ ẩm chuẩn xác, bảo vệ tối đa hàng hóa.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-4 hover:bg-white/[0.07] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Phân Quyền Chi Nhánh Chặt Chẽ</h4>
                <p className="text-xs text-slate-300 mt-0.5">Cách ly dữ liệu từng cơ sở (SA-03), kiểm soát truy cập tuyệt đối.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-white/10 pt-4">
          <span>SWP391 · Capstone Project Fall 2026</span>
          <span>Security JWT · Spring Boot 3 & React 19</span>
        </div>
      </div>

      {/* CỘT PHẢI: Form Đăng Nhập */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-[#f2f9f7] lg:bg-white relative">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Header */}
          <div className="lg:hidden mb-4">
            <Logo 
              to="/" 
              size="md" 
              subtitle="Hệ Thống Quản Lý Kho Tự Phục Vụ" 
            />
          </div>

          {/* Form Header */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Đăng nhập tài khoản
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Nhập email và mật khẩu của bạn để truy cập vào cổng làm việc.
            </p>
          </div>

          {/* Error / Success Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && !errorMsg && !successRole && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {successRole && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Đăng nhập thành công! Đang chuyển hướng vào portal...</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700 hover:underline font-semibold"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                  className="w-4 h-4 rounded bg-white border-slate-300 text-brand-500 focus:ring-brand-400"
                />
                <span className="text-xs text-slate-600">Ghi nhớ đăng nhập trên thiết bị này</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm shadow-brand-500/25 hover:shadow-brand-500/35 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-medium">hoặc đăng nhập bằng</span>
              </div>
            </div>

            {/* Google Sign-In Button Container */}
            <div className="flex flex-col items-center justify-center min-h-[44px]">
              <div id="googleSignInBtn" className="w-full flex justify-center" />
            </div>
          </form>

          {/* Link to Register */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-xs text-slate-600">
              Chưa có tài khoản thuê kho?{' '}
              <Link
                to="/auth/register"
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1 ml-1"
              >
                Đăng ký tài khoản mới <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>

          {/* Footer Back Link */}
          <div className="text-center pt-2">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-brand-600 transition-colors inline-flex items-center gap-1.5"
            >
              <span>← Quay lại Trang Chủ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
