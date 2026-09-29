import React, { useEffect, useState } from 'react';
import { UserPlus, Mail, Lock, Phone, CreditCard, Building2, Check, X, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import type { AppUser, UserRoleType } from '@/api/user';
import { createUser } from '@/api/user';
import { fetchAllActiveFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: AppUser) => void;
}

const ROLES: { role: UserRoleType; label: string }[] = [
  { role: 'FACILITY_STAFF', label: 'Nhân viên cơ sở (Facility Staff)' },
  { role: 'FACILITY_MANAGER', label: 'Quản lý cơ sở (Facility Manager)' },
  { role: 'BUSINESS_OPERATIONS_MANAGER', label: 'Quản lý kinh doanh (BOM)' },
  { role: 'SYSTEM_ADMINISTRATOR', label: 'Quản trị viên (System Admin)' },
  { role: 'STORAGE_CUSTOMER', label: 'Khách thuê kho (Customer)' },
];

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [role, setRole] = useState<UserRoleType>('FACILITY_STAFF');
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<number[]>([]);

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requiresFacility = role === 'FACILITY_STAFF' || role === 'FACILITY_MANAGER';

  useEffect(() => {
    let isMounted = true;
    fetchAllActiveFacilities()

      .then((data) => {
        if (isMounted) {
          setFacilities(data);
          setLoadingFacilities(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Lỗi khi tải cơ sở:', err);
          setLoadingFacilities(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    setFullName('');
    setEmail('');
    setPassword('password123');
    setPhone('');
    setIdentityNumber('');
    setRole('FACILITY_STAFF');
    setSelectedFacilityIds([]);
    setErrorMsg(null);
    onClose();
  };

  if (!isOpen) return null;


  const handleFacilityToggle = (facilityId: number) => {
    setErrorMsg(null);
    setSelectedFacilityIds((prev) =>
      prev.includes(facilityId) ? prev.filter((id) => id !== facilityId) : [...prev, facilityId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Mật khẩu khởi tạo phải có ít nhất 8 ký tự.');
      return;
    }

    if (requiresFacility && selectedFacilityIds.length === 0) {
      setErrorMsg('Vai trò Nhân viên hoặc Quản lý cơ sở yêu cầu phải gán ít nhất một cơ sở làm việc.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        identityNumber: identityNumber.trim() || undefined,
        role,
        facilityIds: requiresFacility ? selectedFacilityIds : [],
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Thêm Mới Tài Khoản Người Dùng</h2>
              <p className="text-xs text-slate-300">Cấp quyền truy cập hệ thống (SA-01)</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >

            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Họ tên */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email đăng nhập <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@smartstorage.vn"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Mật khẩu & CCCD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu khởi tạo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số CCCD / CMND
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  placeholder="07909900xxxx"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Vai trò */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vai trò tài khoản <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as UserRoleType);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              {ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Phân quyền cơ sở khi vai trò là Staff / Manager */}
          {requiresFacility && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Cơ sở làm việc phụ trách (SA-03)</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFacilityIds(facilities.map((facility) => facility.id));
                      setErrorMsg(null);
                    }}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-xs text-slate-500">Đã chọn: {selectedFacilityIds.length}</span>
                </span>
              </div>

              {loadingFacilities ? (
                <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải cơ sở...</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {facilities.map((fac) => {
                    const isChecked = selectedFacilityIds.includes(fac.id);
                    return (
                      <label
                        key={fac.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked ? 'bg-blue-50/70 border-blue-300 font-medium' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleFacilityToggle(fac.id)}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                        <span className="truncate flex-1">{fac.name}</span>
                        <span className="text-slate-400 font-mono">#{fac.id}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >

              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tạo Tài Khoản</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
