import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { loginUser, loginWithGoogle, getPortalUrlByRole } from '@/api/auth';
import type { UserRoleType } from '@/api/user';
import authHeroImg from '@/assets/images/auth-hero-3d.jpg';

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
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#125449] via-[#1c6e60] to-[#11473e] border-r border-teal-600/30">
        {/* Decorative Glow Elements - Ánh sáng Aurora tươi tắn, rạng rỡ */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-brand-300/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] bg-teal-200/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-emerald-300/25 rounded-full blur-2xl pointer-events-none" />

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

        {/* Center Content: Slogan & 3D SmartStorage Visual Asset */}
        <div className="relative z-10 my-auto py-6 space-y-6 max-w-lg">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
              An toàn lưu trữ, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-emerald-200 to-teal-100">
                Linh hoạt vận hành
              </span>
            </h1>
            <p className="text-sm text-teal-100/90 leading-relaxed">
              Hệ thống kho tự quản thông minh, truy cập 24/7 và kiểm soát hoàn toàn trên thiết bị của bạn.
            </p>
          </div>

          {/* 3D Visual Asset Card: Mô hình SmartStorage bo góc gọn gàng */}
          <div className="relative rounded-2xl overflow-hidden border border-white/25 bg-white/10 shadow-2xl backdrop-blur-md group">
            <img
              src={authHeroImg}
              alt="Mô hình dịch vụ kho tự quản SmartStorage"
              className="w-full h-44 sm:h-52 object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e3f37]/85 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
              <span className="font-semibold flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Cơ sở mở cửa 24/7
              </span>
              <span className="text-[11px] text-teal-100 bg-teal-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-teal-400/30 font-medium">
                Hệ thống Smart Lock
              </span>
            </div>
          </div>

          {/* 3 Compact Feature Highlights */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-white/[0.08] border border-white/20 text-center backdrop-blur-sm">
              <span className="block text-xs font-bold text-white">Linh hoạt</span>
              <span className="block text-[10px] text-teal-100/80 mt-0.5">Thuê theo tháng</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.08] border border-white/20 text-center backdrop-blur-sm">
              <span className="block text-xs font-bold text-white">Mã PIN riêng</span>
              <span className="block text-[10px] text-teal-100/80 mt-0.5">Khóa điện tử cá nhân</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.08] border border-white/20 text-center backdrop-blur-sm">
              <span className="block text-xs font-bold text-white">An tâm</span>
              <span className="block text-[10px] text-teal-100/80 mt-0.5">Riêng tư & Bảo mật</span>
            </div>
          </div>
        </div>

        {/* Bottom Note: Liên kết người dùng thân thiện, xóa chi tiết kỹ thuật */}
        <div className="relative z-10 text-xs text-teal-200/80 flex items-center justify-between border-t border-white/15 pt-4">
          <div className="flex items-center gap-3 text-[11px]">
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          </div>
          <span className="text-brand-200 font-semibold text-[11px] flex items-center gap-1.5">
            Hotline: <strong className="text-white font-bold">1900 8888</strong>
          </span>
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
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
