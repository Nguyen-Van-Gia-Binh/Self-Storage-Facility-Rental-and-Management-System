// frontend/src/features/manager/components/CustomerInfoPanel.tsx
import React from 'react';
import { User, Phone, Mail } from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';

interface CustomerInfoPanelProps {
  contract: ManagerContractItem;
}

export const CustomerInfoPanel: React.FC<CustomerInfoPanelProps> = ({ contract }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <User className="w-4 h-4 text-brand-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Thông tin khách hàng
        </h3>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Họ và tên:</span>
          <span className="font-bold text-slate-900">{contract.customerName}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Số điện thoại:</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            {contract.customerPhone}
          </span>
        </div>

        {contract.customerEmail && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Email:</span>
            <span className="text-slate-700 flex items-center gap-1 truncate max-w-[200px]">
              <Mail className="w-3 h-3 text-slate-400" />
              {contract.customerEmail}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-medium">Mã khách hàng:</span>
          <span className="font-mono text-slate-600">CUST-{contract.customerId}</span>
        </div>
      </div>
    </div>
  );
};
