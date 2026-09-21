import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { forgotPassword } from '@/api/auth';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
      startCountdown(60);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Không thể gửi yêu cầu phục hồi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      startCountdown(60);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Không thể gửi lại email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-10 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Boxes className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-xl font-black tracking-tight text-white">SmartStorage</span>
            <p className="text-xs text-slate-400">Self-Storage Management</p>
          </div>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative z-10 space-y-6">
        {!isSubmitted ? (
          <>
            {/* Step 1: Input Email */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Quên mật khẩu?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Đừng lo lắng! Hãy nhập email bạn đã đăng ký tài khoản để nhận liên kết thiết lập lại mật khẩu mới.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Địa chỉ Email tài khoản
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Đang gửi yêu cầu...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi Liên Kết Đặt Lại Mật Khẩu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Step 2: Email Sent Confirmation */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Kiểm tra hòm thư của bạn
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ email:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-300 font-mono text-xs break-all">
                {email}
              </div>
              <p className="text-[11px] text-slate-500">
                Nếu không thấy email trong vài phút, vui lòng kiểm tra thêm thư mục <strong>Spam / Rác</strong> hoặc gửi lại.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại email hướng dẫn'}
                </span>
              </button>

              <Link
                to="/auth/login"
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Đăng Nhập Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}

        {/* Back Link */}
        <div className="text-center pt-2 border-t border-slate-800">
          <Link
            to="/auth/login"
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
