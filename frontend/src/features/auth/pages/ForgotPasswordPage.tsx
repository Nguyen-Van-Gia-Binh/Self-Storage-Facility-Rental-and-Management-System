import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowLeft,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  Check,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { forgotPassword, verifyOtp, resetPassword } from '@/api/auth';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Quy trình 4 bước chuẩn:
  // 1. 'EMAIL_INPUT'         -> Nhập email gửi mã OTP
  // 2. 'OTP_INPUT'           -> Nhập mã OTP 6 số và bấm xác thực (kiểm tra đúng mã)
  // 3. 'NEW_PASSWORD_INPUT'  -> Khi mã OTP đã đúng mới mở ô nhập mật khẩu mới
  // 4. 'SUCCESS'             -> Thông báo thành công và chuyển hướng đăng nhập
  const [step, setStep] = useState<'EMAIL_INPUT' | 'OTP_INPUT' | 'NEW_PASSWORD_INPUT' | 'SUCCESS'>('EMAIL_INPUT');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Timer countdown 60s
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // BƯỚC 1: Gửi mã OTP tới email
  const handleRequestOtp = async (e: React.FormEvent) => {
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
      setStep('OTP_INPUT');
      setCountdown(60);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setCountdown(60);
      setOtp('');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: Xác thực mã OTP (Đúng mã mới cho qua bước 3)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.');
      return;
    }

    if (countdown <= 0) {
      setErrorMsg('Mã OTP đã hết hạn sau 60 giây. Vui lòng bấm "Gửi lại mã" để nhận mã mới.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      // Mã đúng -> Chuyển sang bước 3 nhập mật khẩu mới
      setStep('NEW_PASSWORD_INPUT');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Mã xác thực OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 3: Thiết lập mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep('SUCCESS');
      // Tự động chuyển hướng sau 3.5s
      setTimeout(() => {
        navigate('/auth/login');
      }, 3500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Không thể cập nhật mật khẩu mới. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f2f9f7] text-slate-900 relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-10 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 mb-8 text-center">
        <Logo 
          to="/" 
          size="lg" 
          subtitle="Self-Storage Facility Rental & Management" 
        />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative z-10 space-y-6">
        
        {/* STEP 1: Nhập Email */}
        {step === 'EMAIL_INPUT' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/60 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Quên mật khẩu?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Nhập email tài khoản của bạn để nhận mã xác thực OTP 6 số qua hộp thư Gmail (hiệu lực trong 60 giây).
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Địa chỉ Email tài khoản
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm shadow-brand-500/25 hover:shadow-brand-500/35 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang gửi mã OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi Mã Xác Thực OTP (60s)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: Nhập Mã OTP và Xác Thực (Chưa mở form mật khẩu) */}
        {step === 'OTP_INPUT' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/60 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Xác thực mã OTP
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mã xác thực đã gửi đến <strong className="text-brand-700 font-mono font-bold">{email}</strong>.
              </p>

              {/* Countdown Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs mt-1 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
                <span className="text-slate-600">Hiệu lực mã:</span>
                <span className={`font-mono font-bold ${countdown > 10 ? 'text-brand-700' : 'text-rose-600 animate-pulse'}`}>
                  00:{countdown < 10 ? `0${countdown}` : countdown}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* OTP Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mã xác thực OTP (6 chữ số)
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className="text-xs text-brand-600 hover:text-brand-700 hover:underline disabled:opacity-40 disabled:hover:no-underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[10px] text-xl font-mono font-extrabold py-3 rounded-xl bg-slate-50 border border-slate-200 text-brand-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs"
                />
              </div>

              {/* Submit Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6 || countdown <= 0}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm shadow-brand-500/25 hover:shadow-brand-500/35 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang kiểm tra mã...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Thực Mã OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 3: Nhập Mật Khẩu Mới (Chỉ hiện khi mã OTP đã được kiểm tra đúng) */}
        {step === 'NEW_PASSWORD_INPUT' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Đặt lại mật khẩu mới
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mã OTP hợp lệ! Hãy nhập mật khẩu mới cho tài khoản <strong className="text-slate-800">{email}</strong>.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
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

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Reset Button */}
              <button
                type="submit"
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm shadow-brand-500/25 hover:shadow-brand-500/35 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Lại Mật Khẩu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* STEP 4: Thành công */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Đặt lại mật khẩu thành công!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mật khẩu mới của bạn đã được cập nhật an toàn vào hệ thống. Đang chuyển hướng về trang Đăng nhập...
            </p>

            <div className="pt-2">
              <Link
                to="/auth/login"
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đăng Nhập Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-2 border-t border-slate-200">
          <Link
            to="/auth/login"
            className="text-xs text-slate-500 hover:text-brand-600 transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
