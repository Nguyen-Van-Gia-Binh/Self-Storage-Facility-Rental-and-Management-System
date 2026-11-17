// frontend/src/features/manager/components/CustomerInfoPanel.tsx
import React from 'react';
import type { ManagerContractItem } from '@/types/contractManager';

interface CustomerInfoPanelProps {
  contract?: ManagerContractItem;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: number | string;
  plain?: boolean;
}

export const CustomerInfoPanel: React.FC<CustomerInfoPanelProps> = ({
  contract,
  customerName,
  customerPhone,
  customerEmail,
  customerId,
  plain = false,
}) => {
  const name = customerName || contract?.customerName || 'Khách hàng';
  const phone = customerPhone || contract?.customerPhone || 'Chưa cập nhật';
  const email = customerEmail || contract?.customerEmail;
  const id = customerId || contract?.customerId;

  if (plain) {
    return (
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
          Thông tin Khách hàng
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Họ và tên</span>
            <span className="font-medium text-gray-900">{name}</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Số điện thoại</span>
            <span className="font-medium text-gray-900 tabular-nums">{phone}</span>
          </div>

          {email && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Email</span>
              <span className="font-medium text-gray-900 break-all">{email}</span>
            </div>
          )}

          {id && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">Mã khách hàng</span>
              <span className="font-mono text-gray-700">CUST-{id}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        Thông tin khách hàng
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Họ và tên:</span>
          <span className="font-semibold text-gray-900">{name}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Số điện thoại:</span>
          <span className="font-medium text-gray-900 tabular-nums">{phone}</span>
        </div>

        {email && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-500">Email:</span>
            <span className="text-gray-700 truncate max-w-[220px]">{email}</span>
          </div>
        )}

        {id && (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <span className="text-gray-500">Mã khách hàng:</span>
            <span className="font-mono text-gray-600">CUST-{id}</span>
          </div>
        )}
      </div>
    </div>
  );
};
