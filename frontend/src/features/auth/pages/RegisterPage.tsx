import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
  KeyRound,
  RotateCcw,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { registerUser, sendRegisterOtp } from '@/api/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Luồng 2 bước: 'form' (Nhập thông tin) -> 'otp' (Xác thực Email OTP 5 phút)
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP states
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Bộ đếm lùi thời gian gửi lại OTP (cooldown 60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Kiểm tra độ mạnh mật khẩu và điều kiện khớp
  const isPasswordLongEnough = password.length >= 8;
  const isPasswordMatching = password.length > 0 && password === confirmPassword;

  // Bước 1: Kiểm tra dữ liệu và yêu cầu gửi OTP xác thực email (5 phút hiệu lực)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    // Validate họ tên
    if (fullName.trim().length < 2) {
      setErrorMsg('Họ và tên phải có tối thiểu 2 ký tự.');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Địa chỉ email không đúng định dạng.');
      return;
    }

    // Validate số điện thoại (nếu có)
    if (phone.trim() && !/^(0[0-9]{9,10})$/.test(phone.trim())) {
      setErrorMsg('Số điện thoại phải từ 10 đến 11 chữ số (bắt đầu bằng số 0).');
      return;
    }

    // Validate mật khẩu
    if (!isPasswordLongEnough) {
      setErrorMsg('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }

    if (!isPasswordMatching) {
      setErrorMsg('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Vui lòng đồng ý với Điều khoản sử dụng dịch vụ.');
      return;
    }

    setSendingOtp(true);
    try {
      await sendRegisterOtp(email.trim().toLowerCase());
      setStep('otp');
      setResendCooldown(60);
      setInfoMsg(`Mã xác thực gồm 6 chữ số đã được gửi tới ${email.trim().toLowerCase()}. Mã có hiệu lực trong 5 phút.`);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string; errors?: Record<string, string> };

      if (error.status === 409 || error.message?.includes('EMAIL_ALREADY_EXISTS') || error.message?.includes('đã được sử dụng')) {
        setErrorMsg('Email này đã được sử dụng bởi một tài khoản khác. Vui lòng đăng nhập hoặc dùng email khác.');
      } else if (error.message?.includes('60 giây')) {
        setErrorMsg(error.message);
        setStep('otp');
        setResendCooldown(45);
      } else {
        setErrorMsg(error.message || 'Không thể gửi mã xác thực OTP. Vui lòng kiểm tra lại email.');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // Gửi lại mã OTP (chỉ được gửi sau khi hết cooldown 60s)
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    setErrorMsg(null);
    setInfoMsg(null);
    setSendingOtp(true);
    try {
      await sendRegisterOtp(email.trim().toLowerCase());
      setResendCooldown(60);
      setInfoMsg(`Mã OTP mới đã được gửi tới ${email.trim().toLowerCase()}. Vui lòng kiểm tra hộp thư (hoặc mục Spam).`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Bước 2: Xác nhận OTP và hoàn tất tạo tài khoản
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số của mã xác thực OTP.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        otp: otp.trim(),
      });

      setSuccess(true);

      // Chuyển hướng sang trang đăng nhập sau 1.2s để người dùng tự đăng nhập
      setTimeout(() => {
        const targetEmail = email.trim().toLowerCase();
        navigate(`/auth/login?registered=true&email=${encodeURIComponent(targetEmail)}`, {
          state: {
            registered: true,
            email: targetEmail,
          },
        });
      }, 1200);
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string; errors?: Record<string, string> };

      if (error.message?.includes('INVALID_OTP') || error.message?.includes('không chính xác') || error.message?.includes('không đúng')) {
        setErrorMsg('Mã OTP không chính xác hoặc đã qua sử dụng. Vui lòng kiểm tra lại email.');
      } else if (error.message?.includes('OTP_EXPIRED') || error.message?.includes('hết hạn')) {
        setErrorMsg('Mã OTP đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng bấm Gửi lại mã OTP.');
      } else if (error.status === 409 || error.message?.includes('EMAIL_ALREADY_EXISTS')) {
        setErrorMsg('Email này đã được đăng ký trước đó. Vui lòng đăng nhập.');
      } else if (error.errors && Object.keys(error.errors).length > 0) {
        const firstKey = Object.keys(error.errors)[0];
        setErrorMsg(error.errors[firstKey]);
      } else {
        setErrorMsg(error.message || 'Xác thực thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f2f9f7] text-slate-900">
      {/* CỘT TRÁI: Hero Showcase */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[#0c2420] via-[#0f2d28] to-[#0a1614] border-r border-[#1a3832]/60">
        {/* Decorative Glow Elements */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header / Logo */}
        <div className="relative z-10">
          <Logo 
            to="/" 
            variant="light" 
            size="lg" 
            badge="Customer" 
            subtitle="Self-Storage Facility Rental & Management" 
          />
        </div>

        {/* Center Benefits */}
        <div className="relative z-10 my-auto py-8 space-y-7 max-w-md">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/60 border border-brand-700/60 text-xs font-medium text-brand-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đặc quyền Khách hàng Thành viên</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
              Tạo tài khoản thuê kho <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-emerald-200 to-teal-100">
                Nhanh chóng & An tâm
              </span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Trải nghiệm dịch vụ kho tự phục vụ thông minh với quy trình xác thực email an toàn, bảo vệ tài khoản tối đa và quản lý hợp đồng trực tuyến 24/7.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Xác thực Email chống Spam</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">Mã OTP bảo mật 5 phút gửi trực tiếp đến hộp thư chính chủ.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center flex-shrink-0 mt-0.5 border border-teal-500/30">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Ra vào tự do với mã PIN riêng</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">Cửa kho điện tử hoạt động 24/7, tự chủ cất và lấy đồ mọi lúc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="relative z-10 text-xs text-slate-400 border-t border-white/10 pt-4">
          <span>Cam kết bảo mật thông tin khách hàng tuyệt đối theo chuẩn quốc tế.</span>
        </div>
      </div>

      {/* CỘT PHẢI: Form Đăng Ký */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-[#f2f9f7] lg:bg-white relative">
        <div className="w-full max-w-lg space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden mb-2">
            <Logo 
              to="/" 
              size="md" 
              subtitle="Đăng ký tài khoản khách hàng" 
            />
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'form' ? 'bg-brand-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                {step === 'otp' ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className={`text-xs font-semibold ${step === 'form' ? 'text-slate-900' : 'text-slate-500'}`}>
                Thông tin tài khoản
              </span>
            </div>

            <div className="h-0.5 w-12 bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                2
              </div>
              <span className={`text-xs font-semibold ${step === 'otp' ? 'text-slate-900' : 'text-slate-400'}`}>
                Xác thực Email
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {step === 'form' ? 'Đăng ký tài khoản mới' : 'Xác thực địa chỉ Email'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {step === 'form'
                ? 'Điền thông tin bên dưới để nhận mã xác thực qua email.'
                : 'Nhập mã OTP 6 số đã được gửi đến email để hoàn tất tạo tài khoản.'}
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
              <span>{infoMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Đăng ký tài khoản thành công! Đang chuyển hướng bạn tới trang đăng nhập...</span>
            </div>
          )}

          {/* BƯỚC 1: Form Nhập Thông Tin Cá Nhân */}
          {step === 'form' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              {/* Họ và tên */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Khách"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs"
                  />
                </div>
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Địa chỉ Email <span className="text-rose-500">*</span>
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

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Số điện thoại <span className="text-slate-400 font-normal">(để nhận mã PIN)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
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

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Validation indicators */}
              <div className="flex flex-wrap items-center gap-4 text-xs py-1">
                <span className={`inline-flex items-center gap-1 ${isPasswordLongEnough ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${isPasswordLongEnough ? 'text-emerald-600' : 'opacity-40'}`} />
                  Tối thiểu 8 ký tự
                </span>
                <span className={`inline-flex items-center gap-1 ${isPasswordMatching ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${isPasswordMatching ? 'text-emerald-600' : 'opacity-40'}`} />
                  Mật khẩu khớp nhau
                </span>
              </div>

              {/* Agree Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded bg-white border-slate-300 text-brand-500 focus:ring-brand-400"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Tôi đồng ý với{' '}
                    <span className="text-brand-600 hover:underline font-semibold">Điều khoản dịch vụ</span>{' '}
                    và{' '}
                    <span className="text-brand-600 hover:underline font-semibold">Chính sách bảo vệ quyền riêng tư</span>{' '}
                    của hệ thống SmartStorage.
                  </span>
                </label>
              </div>

              {/* Submit Button (Tiếp tục gửi OTP) */}
              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm shadow-brand-500/25 hover:shadow-brand-500/35 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang gửi mã OTP xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp Tục — Nhận Mã OTP Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* BƯỚC 2: Form Nhập Mã OTP (Hiệu lực 5 phút) */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-5 animate-in fade-in">
              {/* Card thông tin email đã gửi */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-emerald-800">Email nhận mã OTP:</div>
                    <div className="text-xs font-bold text-slate-900 truncate">{email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex-shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
              </div>

              {/* Input OTP 6 số */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 text-center">
                  Nhập mã 6 chữ số được gửi tới hộp thư của bạn:
                </label>
                <div className="relative max-w-xs mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-300 text-2xl font-bold tracking-[0.5em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-xs"
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mã OTP đăng ký có hiệu lực trong vòng <strong>5 phút</strong>.</span>
                </div>
              </div>

              {/* Resend OTP button */}
              <div className="text-center">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || sendingOtp}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi lại mã...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {resendCooldown > 0
                          ? `Gửi lại mã sau (${resendCooldown}s)`
                          : 'Chưa nhận được mã? Gửi lại'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm shadow-brand-500/25 hover:shadow-brand-500/35 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang xác thực & Tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận & Hoàn Tất Đăng Ký</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Link back to Login */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <p className="text-xs text-slate-600">
              Đã có tài khoản trên hệ thống?{' '}
              <Link
                to="/auth/login"
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1 ml-1"
              >
                Đăng nhập ngay <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>

          {/* Footer Back Link */}
          <div className="text-center pt-1">
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


