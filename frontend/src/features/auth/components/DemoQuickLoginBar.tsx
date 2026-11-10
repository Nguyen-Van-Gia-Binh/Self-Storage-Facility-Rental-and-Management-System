import React, { useState } from 'react';
import { KeyRound, ChevronUp } from 'lucide-react';

export interface DemoAccount {
  roleKey: string;
  label: string;
  email: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    roleKey: 'CUSTOMER',
    label: 'Khách hàng',
    email: 'nhi.customer@gmail.com',
    password: 'password123',
  },
  {
    roleKey: 'STAFF_HUNG',
    label: 'Nhân viên Hùng',
    email: 'staff.q1@smartstorage.vn',
    password: 'password123',
  },
  {
    roleKey: 'STAFF_VIEN',
    label: 'Nhân viên Viên',
    email: 'staff@storage.vn',
    password: 'password123',
  },
  {
    roleKey: 'MANAGER',
    label: 'Quản lý FM',
    email: 'fm.q1@smartstorage.vn',
    password: 'password123',
  },
  {
    roleKey: 'BOM',
    label: 'Giám đốc BOM',
    email: 'bom@smartstorage.vn',
    password: 'password123',
  },
  {
    roleKey: 'ADMIN',
    label: 'Admin',
    email: 'admin@smartstorage.vn',
    password: 'password123',
  },
];

interface DemoQuickLoginBarProps {
  selectedEmail: string;
  onSelectAccount: (email: string, password: string) => void;
}

/**
 * Thanh điền nhanh 6 tài khoản mẫu thuộc 5 vai trò (kèm 2 nhân viên Hùng & Viên) phục vụ demo bảo vệ đồ án.
 * Bấm 1 lần để điền sẵn Email & Mật khẩu vào form, có thể thu gọn bất kỳ lúc nào.
 */
export const DemoQuickLoginBar: React.FC<DemoQuickLoginBarProps> = ({
  selectedEmail,
  onSelectAccount,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-brand-700 hover:bg-brand-50/70 border border-slate-200/80 bg-white transition-colors cursor-pointer"
        >
          <KeyRound className="w-3 h-3 text-brand-500" />
          Demo nhanh
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-50/90 border border-slate-200/90 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          <KeyRound className="w-3.5 h-3.5 text-brand-600" />
          Điền nhanh tài khoản Demo
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Ẩn"
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <span>Ẩn</span>
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {DEMO_ACCOUNTS.map((acc) => {
          const isSelected = selectedEmail.trim().toLowerCase() === acc.email.toLowerCase();
          return (
            <button
              key={acc.roleKey}
              type="button"
              title={`${acc.email} / ${acc.password}`}
              onClick={() => onSelectAccount(acc.email, acc.password)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? 'bg-brand-50 border-brand-500 text-brand-700 font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-700'
              }`}
            >
              {acc.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

