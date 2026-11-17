import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
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
import { LoginProductPanel } from '../components/LoginProductPanel';
import { DemoQuickLoginBar } from '../components/DemoQuickLoginBar';
import {
  TermsAndPolicyModal,
  type TermsPolicyTabKey,
} from '@/components/common/TermsAndPolicyModal';

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
  const [termsModal, setTermsModal] = useState<{
    isOpen: boolean;
    initialTab: TermsPolicyTabKey;
  }>({
    isOpen: false,
    initialTab: 'booking',
  });

  const openTermsModal = (tab: TermsPolicyTabKey = 'booking') => {
    setTermsModal({ isOpen: true, initialTab: tab });
  };

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
            theme: 'outline',
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
    <div className="flex min-h-screen bg-white text-slate-900">
      <LoginProductPanel />
      <div className="flex flex-1 overflow-y-auto px-4 sm:px-6 lg:w-1/2 lg:flex-none lg:px-20 xl:px-24">
        <div className="m-auto w-full max-w-md space-y-5 py-10">
          <Logo to="/" size="md" subtitle="Hệ thống quản lý kho tự phục vụ" />

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Đăng nhập tài khoản
            </h1>
            <p className="text-sm text-slate-600">Chào mừng trở lại! Vui lòng đăng nhập.</p>
          </div>

          <DemoQuickLoginBar
            selectedEmail={email}
            onSelectAccount={(demoEmail, demoPassword) => {
              setEmail(demoEmail);
              setPassword(demoPassword);
              setErrorMsg(null);
            }}
          />

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 sm:text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && !errorMsg && !successRole && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 sm:text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {successRole && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 sm:text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Đăng nhập thành công! Đang chuyển hướng vào portal...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                  Mật khẩu
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 bg-white text-brand-500 focus:ring-brand-400"
              />
              <span className="text-xs text-slate-600">Ghi nhớ đăng nhập trên thiết bị này</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 font-medium text-slate-400">hoặc đăng nhập bằng</span>
              </div>
            </div>

            <div className="flex min-h-11 flex-col items-center justify-center">
              <div id="googleSignInBtn" className="flex w-full justify-center" />
            </div>
          </form>

          <p className="text-center text-xs text-slate-600">
            Chưa có tài khoản thuê kho?{' '}
            <Link
              to="/auth/register"
              className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Đăng ký tài khoản mới
            </Link>
          </p>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openTermsModal('privacy')}
                className="min-h-11 hover:text-brand-600"
              >
                Chính sách bảo mật
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => openTermsModal('booking')}
                className="min-h-11 hover:text-brand-600"
              >
                Điều khoản dịch vụ
              </button>
            </div>
            <span>
              Hotline: <strong className="font-semibold text-slate-700">1900 8888</strong>
            </span>
          </div>

          <div className="text-center">
            <Link to="/" className="inline-flex min-h-11 items-center text-xs text-slate-500 hover:text-brand-600">
              ← Quay lại Trang Chủ
            </Link>
          </div>
        </div>
      </div>

      <TermsAndPolicyModal
        isOpen={termsModal.isOpen}
        onClose={() => setTermsModal((prev) => ({ ...prev, isOpen: false }))}
        initialTab={termsModal.initialTab}
      />
    </div>
  );
};
