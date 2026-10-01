import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Boxes,
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
} from 'lucide-react';
import { registerUser } from '@/api/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Kiểm tra độ mạnh mật khẩu và điều kiện khớp
  const isPasswordLongEnough = password.length >= 8;
  const isPasswordMatching = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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

    setLoading(true);
    try {
      await registerUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
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

      if (error.status === 409 || error.message?.includes('EMAIL_ALREADY_EXISTS')) {
        setErrorMsg('Email này đã được đăng ký trước đó. Vui lòng đăng nhập hoặc sử dụng email khác.');
      } else if (error.errors && Object.keys(error.errors).length > 0) {
        const firstKey = Object.keys(error.errors)[0];
        setErrorMsg(error.errors[firstKey]);
      } else {
        setErrorMsg(error.message || 'Không thể hoàn tất đăng ký. Vui lòng thử lại sau ít phút.');
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
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">SmartStorage</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full">
                  Customer
                </span>
              </div>
              <p className="text-xs text-slate-400">Self-Storage Facility Rental & Management</p>
            </div>
          </Link>
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
              Trải nghiệm dịch vụ kho tự phục vụ thông minh với quy trình đặt chỗ chỉ trong 3 bước, bảo mật tuyệt đối và quản lý hợp đồng trực tuyến 24/7.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-300 flex items-center justify-center flex-shrink-0 mt-0.5 border border-brand-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Giữ chỗ tức thì 48 giờ</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">Đặt cọc online và bảo lưu vị trí ô kho mong muốn trong 48 tiếng.</p>
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
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-sm">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">SmartStorage</span>
              <p className="text-xs text-slate-500">Đăng ký tài khoản khách hàng</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Đăng ký tài khoản mới
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Điền thông tin bên dưới để bắt đầu đặt kho và nhận ưu đãi thuê kho.
            </p>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Đăng ký tài khoản thành công! Đang chuyển hướng bạn tới trang đăng nhập...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-sm shadow-brand-500/25 hover:shadow-brand-500/35 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <span>Hoàn Tất Đăng Ký</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

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

