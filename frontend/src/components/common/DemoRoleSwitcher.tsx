import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { tokenStorage, normalizeRole, type UserRole } from '@/utils/tokenStorage';
import { loginAsDemoRole } from '@/api/auth';

interface DemoRoleSwitcherProps {
  currentRole?: UserRole;
  className?: string;
  onRoleChanged?: (newRole: UserRole) => void;
}

const PORTAL_ROUTES: Record<UserRole, string> = {
  CUSTOMER: '/customer',
  STAFF: '/staff/check-in',
  MANAGER: '/manager/units',
  BOM: '/bom/facilities',
  ADMIN: '/admin/users',
};

export const DemoRoleSwitcher: React.FC<DemoRoleSwitcherProps> = ({
  currentRole,
  className = '',
  onRoleChanged,
}) => {
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);

  // Lấy role hiện tại từ prop hoặc từ localStorage
  const activeRole: UserRole = currentRole || tokenStorage.getUser()?.role || 'CUSTOMER';

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = normalizeRole(e.target.value);
    if (selectedRole === activeRole && !isSwitching) return;

    setIsSwitching(true);
    try {
      // 1. Thực hiện đăng nhập thật vào tài khoản Demo backend để nhận JWT Token
      await loginAsDemoRole(selectedRole);

      // 2. Callback nếu có component cha cần cập nhật state
      if (onRoleChanged) {
        onRoleChanged(selectedRole);
      }

      // 3. Điều hướng tới portal tương ứng
      const targetPath = PORTAL_ROUTES[selectedRole] || '/customer';
      navigate(targetPath);
    } catch (err) {
      console.warn('Lỗi khi chuyển đổi vai trò Demo:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      className={`flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-xl text-xs border border-slate-200/90 shadow-xs transition-colors ${className}`}
      title="Chuyển nhanh vai trò Demo và tự động đăng nhập JWT Token tương ứng"
    >
      {isSwitching ? (
        <Loader2 className="w-3.5 h-3.5 text-brand-600 animate-spin" />
      ) : (
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] hidden md:inline">
          Demo:
        </span>
      )}

      <select
        value={activeRole}
        onChange={handleChange}
        disabled={isSwitching}
        className="bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-none text-xs disabled:opacity-50"
      >
        <option value="CUSTOMER">Customer (Khách hàng)</option>
        <option value="STAFF">Staff (Nhân viên)</option>
        <option value="MANAGER">Manager (Quản lý)</option>
        <option value="BOM">BOM (Kinh doanh)</option>
        <option value="ADMIN">Admin (Quản trị)</option>
      </select>
    </div>
  );
};
